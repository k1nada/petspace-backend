const { Schema, model } = require("mongoose");

const Repost = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      index: true,
    },
    photo: {
      type: Schema.Types.ObjectId,
      ref: "Photo",
      index: true,
    },
  },
  { timestamps: true },
);

Repost.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } },
);
Repost.index(
  { user: 1, photo: 1 },
  { unique: true, partialFilterExpression: { photo: { $exists: true } } },
);

module.exports = model("Repost", Repost);
