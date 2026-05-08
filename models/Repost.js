const { Schema, model } = require("mongoose");

const Repost = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);

module.exports = model("Repost", Repost);
