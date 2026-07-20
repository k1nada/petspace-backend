const Router = require("express");
const router = new Router();
const { getMessages } = require("../controllers/chatController");

router.get("/:roomId", getMessages);

module.exports = router;
