const { Schema, model } = require("mongoose");

const Postwall = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

module.exports = model("Postwall", Postwall);
