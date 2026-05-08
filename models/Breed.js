const { Schema, model } = require("mongoose");

const Breed = new Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = model("Breed", Breed);