const Router = require("express");
const router = new Router();
const { param, query } = require("express-validator");
const {
  getMessages,
  getConversations,
  markMessagesRead,
} = require("./chatController");
const { authMiddleware } = require("../../middleware/authMiddleware");
const { isValidRoomId, MAX_PAGE_SIZE } = require("../../utils/chat");

const roomIdCheck = param("roomId").custom(isValidRoomId);

router.get("/conversations/:username", authMiddleware, getConversations);
router.post("/:roomId/read", authMiddleware, [roomIdCheck], markMessagesRead);
router.get(
  "/:roomId",
  authMiddleware,
  [
    roomIdCheck,
    query("before").optional().isMongoId(),
    query("after").optional().isMongoId(),
    query("limit").optional().isInt({ min: 1, max: MAX_PAGE_SIZE }).toInt(),
  ],
  getMessages,
);

module.exports = router;
