const User = require("../models/User");
const Notification = require("../models/Notification");
const { errorResponse } = require("../utils/errors");

const toAppNotification = (n) => ({
  id: n.id,
  type: n.type,
  user: n.user ? { name: n.user.name, avatar: n.user.avatar } : undefined,
  createdAt: n.createdAt,
  read: n.read,
});

const getNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    if (req.user.id !== user._id.toString())
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name avatar");

    res.json(notifications.map(toAppNotification));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json(errorResponse("NOT_FOUND"));
    if (notification.recipient.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    notification.read = true;
    await notification.save();
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    if (req.user.id !== user._id.toString())
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    await Notification.updateMany(
      { recipient: user._id, read: false },
      { read: true },
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
