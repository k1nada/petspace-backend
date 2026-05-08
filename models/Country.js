const { Schema, model } = require("mongoose");

const CountrySchema = new Schema({
  country: { type: String, required: true, unique: true },
  cities: [{ type: String }],
});

module.exports = model("Country", CountrySchema);