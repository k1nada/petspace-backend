const Router = require("express");
const router = new Router();
const Message = require("../models/Message");

router.get("/:roomId", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate("sender", "username name avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;