const Router = require("express");
const router = new Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/notifications/:username", authMiddleware, getNotifications);
router.post("/notifications/:id/read", authMiddleware, markNotificationRead);
router.post(
  "/notifications/:username/read-all",
  authMiddleware,
  markAllNotificationsRead,
);

module.exports = router;
