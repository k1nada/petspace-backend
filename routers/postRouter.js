const Router = require("express");
const router = new Router();
const authMiddleware = require("../middleware/authMiddleware");
const postController = require("../controllers/postController");

router.post("/", authMiddleware, postController.createPost);
router.get("/postwall/:postwallId", postController.getPosts);
router.delete("/:postId", authMiddleware, postController.deletePost);

module.exports = router;