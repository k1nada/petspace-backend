const Message = require("../../models/Message");
const User = require("../../models/User");
const { errorResponse, reportError } = require("../../utils/errors");
const { isRoomParticipant } = require("../../utils/chat");

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isRoomParticipant(roomId, req.user.id)) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const messages = await Message.find({ roomId })
      .populate("sender", "username name avatar")
      .populate({
        path: "post",
        select: "content image user createdAt",
        populate: { path: "user", select: "name avatar username" },
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    reportError(err, res);
  }
};

const getConversations = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "friends",
      "username name avatar breed isOnline lastSeen",
    );
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const userId = user._id.toString();

    const messages = await Message.find({
      roomId: { $regex: `^${userId}_|_${userId}$` },
    })
      .sort({ createdAt: 1 })
      .lean();

    const lastMessageByPartnerId = new Map();
    const unreadCountByPartnerId = new Map();
    for (const message of messages) {
      const [firstId, secondId] = message.roomId.split("_");
      const partnerId = firstId === userId ? secondId : firstId;
      lastMessageByPartnerId.set(partnerId, message);

      if (message.sender.toString() === partnerId && !message.read) {
        unreadCountByPartnerId.set(
          partnerId,
          (unreadCountByPartnerId.get(partnerId) ?? 0) + 1,
        );
      }
    }

    const contactsById = new Map(
      user.friends.map((friend) => [
        friend._id.toString(),
        {
          id: friend._id.toString(),
          username: friend.username,
          name: friend.name,
          avatar: friend.avatar,
          isOnline: friend.isOnline,
          lastSeen: friend.lastSeen,
        },
      ]),
    );

    const missingPartnerIds = [...lastMessageByPartnerId.keys()].filter(
      (id) => !contactsById.has(id),
    );

    if (missingPartnerIds.length > 0) {
      const partners = await User.find({
        _id: { $in: missingPartnerIds },
      }).select("username name avatar isOnline lastSeen");
      for (const partner of partners) {
        contactsById.set(partner._id.toString(), {
          id: partner._id.toString(),
          username: partner.username,
          name: partner.name,
          avatar: partner.avatar,
          isOnline: partner.isOnline,
          lastSeen: partner.lastSeen,
        });
      }
    }

    const contacts = [...contactsById.values()].map((contact) => {
      const lastMessage = lastMessageByPartnerId.get(contact.id);
      const unreadCount = unreadCountByPartnerId.get(contact.id) ?? 0;
      return {
        ...contact,
        ...(lastMessage && {
          lastMessage: {
            id: lastMessage._id.toString(),
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            hasPost: !!lastMessage.post,
          },
        }),
        unreadCount,
      };
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
  } catch (err) {
    reportError(err, res);
  }
};

const markMessagesRead = async (req, res) => {
  try {
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
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = { getMessages, getConversations, markMessagesRead };
