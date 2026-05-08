const Router = require("express");
const router = new Router();
const Breed = require("../models/Breed");
const { errorResponse } = require("../utils/errors");

router.get("/", async (req, res) => {
  try {
    const breeds = await Breed.find({}, "name");
    res.json(breeds.map((b) => b.name));
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
});

module.exports = router;
