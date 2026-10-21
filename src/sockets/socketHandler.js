const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const Message = require("../models/Message");
const Post = require("../models/Post");
const User = require("../models/User");
const { errorResponse } = require("../utils/errors");
const {
  MAX_MESSAGE_LENGTH,
  isRoomParticipant,
  getPartnerId,
} = require("../utils/chat");
const {
  isUserOnline,
  addConnection,
  removeConnection,
  getStatusWatcherIds,
} = require("../utils/presence");
const { SOCKET_EVENTS } = require("../utils/socketEvents");

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/;
const MAX_TEMP_ID_LENGTH = 64;
const MAX_MESSAGES_PER_SECOND = 5;
const ONE_SECOND_MS = 1000;

const sendStatus = async (io, userId) => {
  const watcherIds = await getStatusWatcherIds(userId);
  if (watcherIds.length === 0) return;

  const user = await User.findById(userId).select("lastSeen");
  io.to(watcherIds).emit(SOCKET_EVENTS.STATUS_CHANGE, {
    userId,
    isOnline: isUserOnline(userId),
    lastSeen: user?.lastSeen ?? null,
  });
};

const setupSockets = (io) => {
  io.use((socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, secret, {
        algorithms: ["HS256"],
      });
      socket.userId = id;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);
    let recentSendTimes = [];

    socket.on(SOCKET_EVENTS.MESSAGE, async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};

      const now = Date.now();
      recentSendTimes = recentSendTimes.filter(
        (time) => now - time < ONE_SECOND_MS,
      );
      if (recentSendTimes.length >= MAX_MESSAGES_PER_SECOND) {
        return reply({ error: errorResponse("TOO_MANY_REQUESTS") });
      }
      recentSendTimes.push(now);

      try {
        const { roomId, text, postId, tempId } = payload ?? {};
        const messageText = typeof text === "string" ? text.trim() : "";
        const hasPost = typeof postId === "string" && postId !== "";

        if (!messageText && !hasPost) {
          return reply({ error: errorResponse("INVALID_REQUEST") });
        }
        if (messageText.length > MAX_MESSAGE_LENGTH) {
          return reply({ error: errorResponse("INVALID_REQUEST") });
        }
        if (hasPost && !OBJECT_ID_PATTERN.test(postId)) {
          return reply({ error: errorResponse("INVALID_REQUEST") });
        }
        if (!isRoomParticipant(roomId, socket.userId)) {
          return reply({ error: errorResponse("ACCESS_DENIED") });
        }

        const partnerId = getPartnerId(roomId, socket.userId);
        if (!(await User.exists({ _id: partnerId }))) {
          return reply({ error: errorResponse("USER_NOT_FOUND") });
        }
        if (hasPost && !(await Post.exists({ _id: postId }))) {
          return reply({ error: errorResponse("POST_NOT_FOUND") });
        }

        const created = await Message.create({
          roomId,
          participants: roomId.split("_"),
          sender: socket.userId,
          text: messageText,
          post: hasPost ? postId : null,
        });
        await created.populate([
          { path: "sender", select: "username name avatar" },
          {
            path: "post",
            select: "content image user createdAt",
            populate: { path: "user", select: "name avatar username" },
          },
        ]);

        const message = created.toJSON();
        if (typeof tempId === "string" && tempId.length <= MAX_TEMP_ID_LENGTH) {
          message.tempId = tempId;
        }

        io.to(socket.userId).to(partnerId).emit(SOCKET_EVENTS.MESSAGE, message);
        reply({ message });
      } catch (err) {
        console.error(err);
        reply({ error: errorResponse("INTERNAL_SERVER_ERROR") });
      }
    });

    socket.on("disconnect", async () => {
      if (!removeConnection(socket.userId, socket.id)) return;
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        await sendStatus(io, socket.userId);
      } catch (err) {
        console.error(err);
      }
    });

    if (addConnection(socket.userId, socket.id)) {
      User.findByIdAndUpdate(socket.userId, { isOnline: true })
        .then(() => sendStatus(io, socket.userId))
        .catch((err) => console.error(err));
    }
  });
};

module.exports = setupSockets;
