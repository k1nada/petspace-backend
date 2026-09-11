const { Schema, model } = require("mongoose");

const Post = new Schema(
  {
    content: { type: String },
    image: { type: String },
    postwall: {
      type: Schema.Types.ObjectId,
      ref: "Postwall",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

Post.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
});

module.exports = model("Post", Post);
