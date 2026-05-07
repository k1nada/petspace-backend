const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const Post = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postwall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Postwall",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

module.exports = model("Post", Post);