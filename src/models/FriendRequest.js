const { Schema, model } = require("mongoose");

const FriendRequest = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

FriendRequest.virtual("id").get(function () {
  return this._id;
});

FriendRequest.index(
  { from: 1, to: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

module.exports = model("FriendRequest", FriendRequest);
