const Router = require("express");
const router = new Router();
const { getBreeds } = require("./breedsController");

router.get("/", getBreeds);

module.exports = router;
