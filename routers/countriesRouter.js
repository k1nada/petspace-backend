const Router = require("express");
const router = new Router();
const Country = require("../models/Country");
const { errorResponse } = require("../utils/errors");

router.get("/", async (req, res) => {
  try {
    const countries = await Country.find({}, "country");
    res.json(countries.map((c) => c.country));
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
});

router.get("/cities", async (req, res) => {
  try {
    const found = await Country.findOne({ country: req.query.country });
    res.json(found ? found.cities : []);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
});

module.exports = router;
