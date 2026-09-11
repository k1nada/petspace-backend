const { Schema, model } = require("mongoose");

const Photo = new Schema(
  {
    publicId: { type: String, required: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

Photo.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "photo",
});

module.exports = model("Photo", Photo);
