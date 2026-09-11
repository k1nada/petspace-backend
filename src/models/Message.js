const { Schema, model } = require("mongoose");

const Message = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
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

module.exports = model("Message", Message);
