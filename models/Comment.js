const { Schema, model, Types } = require("mongoose");

const Comment = new Schema(
  {
    content: { type: String, trim: true, required: true },
    user: { type: Types.ObjectId, ref: "User", required: true },
    post: { type: Types.ObjectId, ref: "Post" },
    photo: { type: Types.ObjectId, ref: "Photo" },
    likes: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

module.exports = model("Comment", Comment);
