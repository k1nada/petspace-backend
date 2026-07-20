const Message = require("../models/Message");
const { errorResponse } = require("../utils/errors");

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate("sender", "username name avatar")
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { getMessages };