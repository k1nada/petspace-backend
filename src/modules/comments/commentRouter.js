const Router = require("express");
const router = new Router();
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

router.post("/", authMiddleware, createComment);
router.get("/post/:postId", optionalAuthMiddleware, getComments);
router.get("/photo/:photoId", optionalAuthMiddleware, getComments);
router.put("/:commentId", authMiddleware, updateComment);
router.delete("/:commentId", authMiddleware, deleteComment);

module.exports = router;
