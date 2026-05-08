const Router = require("express");
const router = new Router();
const {
  likePost,
  likeComment,
  getPostLikeStatus,
  getCommentLikeStatus,
} = require("../controllers/likesController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/post/:id/status", authMiddleware, getPostLikeStatus);
router.post("/post/:id", authMiddleware, likePost);

router.get("/comment/:id/status", authMiddleware, getCommentLikeStatus);
router.post("/comment/:id", authMiddleware, likeComment);

module.exports = router;