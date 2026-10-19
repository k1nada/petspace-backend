const Notification = require("../../models/Notification");
const { errorResponse, reportError } = require("../../utils/errors");
const { requireSelfByUsername } = require("../../utils/findUsers");

const toAppNotification = (n) => ({
  id: n.id,
  type: n.type,
  user: n.user ? { name: n.user.name, avatar: n.user.avatar } : undefined,
  createdAt: n.createdAt,
  read: n.read,
});

const getNotifications = async (req, res) => {
  try {
    const user = await requireSelfByUsername(req, res);
    if (!user) return;

    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name avatar");

    res.json(notifications.map(toAppNotification));
  } catch (err) {
    reportError(err, res);
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
    reportError(err, res);
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await requireSelfByUsername(req, res);
    if (!user) return;

    await Notification.updateMany(
      { recipient: user._id, read: false },
      { read: true },
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
