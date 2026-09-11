const { Schema, model } = require("mongoose");

const Repost = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  },
  { timestamps: true },
);

Repost.index({ user: 1, post: 1 }, { unique: true });

module.exports = model("Repost", Repost);
