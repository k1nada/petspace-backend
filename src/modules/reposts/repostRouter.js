const Router = require("express");
const router = new Router();
const { authMiddleware } = require("../../middleware/authMiddleware");
const { toggleRepost, toggleRepostPhoto } = require("./repostController");

router.post("/photo/:id", authMiddleware, toggleRepostPhoto);
router.post("/:postId", authMiddleware, toggleRepost);

module.exports = router;
