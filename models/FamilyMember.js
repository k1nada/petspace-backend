const { Schema, model, Types } = require("mongoose");

const FamilyMember = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", required: true },
    relation: { type: String, enum: ["parent", "child"], required: true },
    name: { type: String, trim: true, required: true },
    avatar: { type: String, default: null },
    breed: { type: String, default: null },
    username: { type: String, default: null },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

module.exports = model("FamilyMember", FamilyMember);
