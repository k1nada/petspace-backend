const { Schema, model } = require("mongoose");

const Comment = new Schema(
  {
    content: { type: String, trim: true, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", index: true },
    photo: { type: Schema.Types.ObjectId, ref: "Photo", index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

module.exports = model("Comment", Comment);
