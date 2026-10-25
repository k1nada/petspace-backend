const Router = require("express");
const router = new Router();
const { param, query } = require("express-validator");
const {
  getMessages,
  getConversations,
  markMessagesRead,
  searchMessages,
} = require("./chatController");
const { authMiddleware } = require("../../middleware/authMiddleware");
const {
  isValidRoomId,
  MAX_PAGE_SIZE,
  MAX_MESSAGE_SEARCH_RESULTS,
} = require("../../utils/chat");

const MAX_SEARCH_QUERY_LENGTH = 100;

const roomIdCheck = param("roomId").custom(isValidRoomId);

router.get("/conversations/:username", authMiddleware, getConversations);
router.get(
  "/search",
  authMiddleware,
  [
    query("q").isString().isLength({ max: MAX_SEARCH_QUERY_LENGTH }),
    query("limit")
      .optional()
      .isInt({ min: 1, max: MAX_MESSAGE_SEARCH_RESULTS })
      .toInt(),
  ],
  searchMessages,
);
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
