const { validationResult, matchedData } = require("express-validator");
const Message = require("../../models/Message");
const User = require("../../models/User");
const { errorResponse } = require("../../utils/errors");
const {
  DEFAULT_PAGE_SIZE,
  MAX_MESSAGE_SEARCH_RESULTS,
  MIN_MESSAGE_SEARCH_LENGTH,
  isRoomParticipant,
  getPartnerId,
} = require("../../utils/chat");
const { escapeRegex } = require("../../utils/validation");
const { requireSelfByUsername } = require("../../utils/findUsers");
const { isUserOnline } = require("../../utils/presence");
const { MESSAGE_POPULATE, serializeMessage } = require("../../utils/messages");

const toContact = (user) => ({
  id: user._id.toString(),
  username: user.username,
  name: user.name,
  avatar: user.avatar,
  isOnline: isUserOnline(user._id),
  lastSeen: user.lastSeen,
});

const getMessages = async (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  const { roomId } = req.params;
  const userId = req.user.id;
  if (!isRoomParticipant(roomId, userId)) {
    return res.status(403).json(errorResponse("ACCESS_DENIED"));
  }

  const {
    before,
    after,
    limit = DEFAULT_PAGE_SIZE,
  } = matchedData(req, { locations: ["query"] });
  if (before && after) {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  const partnerExists = await User.exists({
    _id: getPartnerId(roomId, userId),
  });
  if (!partnerExists) {
    return res.status(404).json(errorResponse("USER_NOT_FOUND"));
  }

  const filter = { roomId };
  if (before) filter._id = { $lt: before };
  if (after) filter._id = { $gt: after };

  const sortOrder = after ? 1 : -1;

  const found = await Message.find(filter)
    .sort({ _id: sortOrder })
    .limit(limit + 1)
    .populate(MESSAGE_POPULATE);

  const hasMore = found.length > limit;
  const messages = found
    .slice(0, limit)
    .map((message) => serializeMessage(message, userId));
  if (!after) messages.reverse();

  res.json({ messages, hasMore });
};

const getConversations = async (req, res) => {
  const user = await requireSelfByUsername(req, res, {
    path: "friends",
    select: "username name avatar breed lastSeen",
  });
  if (!user) return;

  const userId = user._id.toString();

  const rooms = await Message.aggregate([
    { $match: { participants: user._id } },
    { $sort: { roomId: 1, _id: -1 } },
    {
      $group: {
        _id: "$roomId",
        lastMessageId: { $first: "$_id" },
        lastMessageText: { $first: "$text" },
        lastMessageCreatedAt: { $first: "$createdAt" },
        lastMessagePost: { $first: "$post" },
        lastMessagePhoto: { $first: "$photo" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$sender", user._id] },
                  { $eq: ["$read", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const lastMessageByPartnerId = new Map();
  const unreadCountByPartnerId = new Map();
  for (const room of rooms) {
    const partnerId = getPartnerId(room._id, userId);
    lastMessageByPartnerId.set(partnerId, {
      _id: room.lastMessageId,
      text: room.lastMessageText,
      createdAt: room.lastMessageCreatedAt,
      post: room.lastMessagePost,
      photo: room.lastMessagePhoto,
    });
    if (room.unreadCount > 0) {
      unreadCountByPartnerId.set(partnerId, room.unreadCount);
    }
  }

  const contactsById = new Map();
  for (const friend of user.friends) {
    contactsById.set(friend._id.toString(), toContact(friend));
  }

  const missingPartnerIds = [...lastMessageByPartnerId.keys()].filter(
    (id) => !contactsById.has(id),
  );

  if (missingPartnerIds.length > 0) {
    const partners = await User.find({
      _id: { $in: missingPartnerIds },
    }).select("username name avatar lastSeen");
    for (const partner of partners) {
      contactsById.set(partner._id.toString(), toContact(partner));
    }
  }

  const contacts = [...contactsById.values()].map((contact) => {
    const lastMessage = lastMessageByPartnerId.get(contact.id);
    const unreadCount = unreadCountByPartnerId.get(contact.id) ?? 0;
    const result = { ...contact, unreadCount };
    if (lastMessage) {
      result.lastMessage = {
        id: lastMessage._id.toString(),
        text: lastMessage.text,
        createdAt: lastMessage.createdAt,
        hasPost: !!lastMessage.post,
        hasPhoto: !!lastMessage.photo,
      };
    }
    return result;
  });

  contacts.sort((a, b) => {
    const aTime = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : 0;
    const bTime = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : 0;
    return bTime - aTime;
  });

  res.json(contacts);
};

const markMessagesRead = async (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  const { roomId } = req.params;
  const userId = req.user.id;

  if (!isRoomParticipant(roomId, userId)) {
    return res.status(403).json(errorResponse("ACCESS_DENIED"));
  }

  await Message.updateMany(
    { roomId, sender: { $ne: userId }, read: false },
    { read: true },
  );

  res.json({ message: "Messages marked as read" });
};

const searchMessages = async (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  const { q, limit = MAX_MESSAGE_SEARCH_RESULTS } = matchedData(req, {
    locations: ["query"],
  });
  const query = q.trim();
  if (query.length < MIN_MESSAGE_SEARCH_LENGTH) return res.json([]);

  const userId = req.user.id;
  const messages = await Message.find({
    participants: userId,
    text: { $regex: escapeRegex(query), $options: "i" },
  })
    .sort({ _id: -1 })
    .limit(limit)
    .select("roomId text createdAt");

  const partnerIds = [
    ...new Set(messages.map((message) => getPartnerId(message.roomId, userId))),
  ];
  const partners = await User.find({ _id: { $in: partnerIds } }).select(
    "username name avatar",
  );
  const partnerById = new Map(
    partners.map((partner) => [partner._id.toString(), partner]),
  );

  const results = [];
  for (const message of messages) {
    const partner = partnerById.get(getPartnerId(message.roomId, userId));
    if (!partner) continue;
    results.push({
      id: message._id.toString(),
      roomId: message.roomId,
      text: message.text,
      createdAt: message.createdAt,
      partner: {
        id: partner._id.toString(),
        username: partner.username,
        name: partner.name,
        avatar: partner.avatar,
      },
    });
  }

  res.json(results);
};

module.exports = {
  getMessages,
  getConversations,
  markMessagesRead,
  searchMessages,
};
