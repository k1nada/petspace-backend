const Router = require("express");
const router = new Router();
const { getCountries, getCities } = require("./countriesController");

router.get("/", getCountries);
router.get("/cities", getCities);

module.exports = router;
