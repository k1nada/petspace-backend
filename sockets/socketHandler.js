const Message = require("../models/Message");
const User = require("../models/User");

const setupSockets = (io) => {
  io.on("connection", (socket) => {
    socket.on("online", async (userId) => {
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("statusChange", { userId, isOnline: true });
    });

    socket.on("join", (roomId) => socket.join(roomId));

    socket.on("message", async ({ roomId, senderId, text }) => {
      const message = await Message.create({ roomId, sender: senderId, text });
      const populated = await message.populate("sender", "username name avatar");
      io.to(roomId).emit("message", populated);
    });

    socket.on("disconnect", async () => {
      if (!socket.userId) return;
      await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      io.emit("statusChange", { userId: socket.userId, isOnline: false });
    });
  });
};

module.exports = setupSockets;