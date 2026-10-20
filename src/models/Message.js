const { Schema, model } = require("mongoose");
const { MAX_MESSAGE_LENGTH } = require("../utils/chat");

const Message = new Schema(
  {
    roomId: { type: String, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "", maxlength: MAX_MESSAGE_LENGTH },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

Message.index({ roomId: 1, createdAt: -1 });
Message.index({ roomId: 1, _id: -1 });
Message.index({ participants: 1 });

module.exports = model("Message", Message);
