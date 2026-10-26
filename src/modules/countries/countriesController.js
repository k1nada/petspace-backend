const Country = require("../../models/Country");

const getCountries = async (req, res) => {
  const countries = await Country.find({}, "country").sort({ country: 1 });
  res.json(countries.map((c) => c.country));
};

const getCities = async (req, res) => {
  const { country } = req.query;
  if (!country?.trim()) return res.json([]);

  const found = await Country.findOne({ country });
  const cities = found ? [...found.cities].sort() : [];
  res.json(cities);
};

module.exports = { getCountries, getCities };
