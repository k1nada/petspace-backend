const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const Message = require("../models/Message");
const User = require("../models/User");
const { isRoomParticipant } = require("../utils/chat");

const onlineSockets = new Map();

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

    socket.on("join", (roomId) => {
      if (isRoomParticipant(roomId, socket.userId)) socket.join(roomId);
    });
    socket.on("leave", (roomId) => socket.leave(roomId));

    socket.on("message", async ({ roomId, text, postId }) => {
      try {
        if (!text && !postId) return;
        if (!isRoomParticipant(roomId, socket.userId)) return;

        const message = await Message.create({
          roomId,
          sender: socket.userId,
          text: text || "",
          post: postId || null,
        });
        const populated = await message.populate([
          { path: "sender", select: "username name avatar" },
          {
            path: "post",
            select: "content image user createdAt",
            populate: { path: "user", select: "name avatar username" },
          },
        ]);
        io.to(roomId).emit("message", populated);

        const [firstId, secondId] = roomId.split("_");
        const recipientId = firstId === socket.userId ? secondId : firstId;
        io.to(recipientId).emit("newMessage", populated);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const sockets = onlineSockets.get(socket.userId);
        if (!sockets) return;

        sockets.delete(socket.id);
        if (sockets.size > 0) return;

        onlineSockets.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        if (!onlineSockets.has(socket.userId)) {
          io.emit("statusChange", { userId: socket.userId, isOnline: false });
        }
      } catch (err) {
        console.error(err);
      }
    });

    const sockets = onlineSockets.get(socket.userId) ?? new Set();
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);
    onlineSockets.set(socket.userId, sockets);

    if (wasOffline) {
      User.findByIdAndUpdate(socket.userId, { isOnline: true })
        .then(() => {
          if (onlineSockets.has(socket.userId)) {
            io.emit("statusChange", { userId: socket.userId, isOnline: true });
          }
        })
        .catch((err) => console.error(err));
    }
  });
};

module.exports = setupSockets;
