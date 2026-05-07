const Router = require("express");
const router = new Router();
const authMiddleware = require("../middleware/authMiddleware");
const commentController = require("../controllers/commentController");

router.post("/", authMiddleware, commentController.createComment);
router.get("/postwall/:postId", commentController.getComments);
router.get("/photo/:photoId", commentController.getComments);
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

module.exports = router;
