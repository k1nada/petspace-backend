const { Schema, model } = require("mongoose");

const Notification = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["like", "comment", "friendRequest", "achievement"],
      required: true,
    },
    read: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

module.exports = model("Notification", Notification);
