const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const Message = require("../models/Message");
const User = require("../models/User");

const setupSockets = (io) => {
  io.use((socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, secret);
      socket.userId = id;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", async (socket) => {
    socket.join(socket.userId);
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    io.emit("statusChange", { userId: socket.userId, isOnline: true });

    socket.on("join", (roomId) => socket.join(roomId));

    socket.on("message", async ({ roomId, text }) => {
      const message = await Message.create({ roomId, sender: socket.userId, text });
      const populated = await message.populate("sender", "username name avatar");
      io.to(roomId).emit("message", populated);
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("statusChange", { userId: socket.userId, isOnline: false });
    });
  });
};

module.exports = setupSockets;