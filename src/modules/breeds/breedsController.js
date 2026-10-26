const Breed = require("../../models/Breed");

const getBreeds = async (req, res) => {
  const breeds = await Breed.find({}, "name").sort({ name: 1 });
  res.json(breeds.map((b) => b.name));
};

module.exports = { getBreeds };
