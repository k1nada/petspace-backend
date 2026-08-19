const Notification = require("../models/Notification");

let io;
const setSocketIO = (ioInstance) => {
  io = ioInstance;
};

const notify = async ({ recipient, user, type }) => {
  if (user && recipient.toString() === user.toString()) return null;

  const notification = await Notification.create({ recipient, user, type });
  await notification.populate("user", "name avatar");

  io.to(recipient.toString()).emit("notification", {
    id: notification.id,
    type: notification.type,
    user: notification.user
      ? { name: notification.user.name, avatar: notification.user.avatar }
      : undefined,
    createdAt: notification.createdAt,
    read: notification.read,
  });

  return notification;
};

module.exports = { notify, setSocketIO };
