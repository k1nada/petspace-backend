const Router = require("express");
const router = new Router();
const { body } = require("express-validator");
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../../middleware/authMiddleware");
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} = require("./commentController");

router.post(
  "/",
  authMiddleware,
  [
    body("content").isString(),
    body("postId").optional({ values: "null" }).isMongoId(),
    body("photoId").optional({ values: "null" }).isMongoId(),
    body("replyCommentId").optional({ values: "null" }).isMongoId(),
  ],
  createComment,
);
router.get("/post/:postId", optionalAuthMiddleware, getComments);
router.get("/photo/:photoId", optionalAuthMiddleware, getComments);
router.put("/:commentId", authMiddleware, updateComment);
router.delete("/:commentId", authMiddleware, deleteComment);

module.exports = router;
