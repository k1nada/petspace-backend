const mongoose = require("mongoose");
const Country = require("../models/Country");
require("dotenv").config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();

    const countries = data.data.map((item) => ({
      country: item.country,
      cities: item.cities.sort((a, b) => a.localeCompare(b)),
    }));

    countries.sort((a, b) => a.country.localeCompare(b.country));

    await Country.deleteMany();
    await Country.insertMany(countries);
    console.log("Done!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
