const mongoose = require("mongoose");
const Breed = require("../models/Breed");
require("dotenv").config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const res = await fetch("https://dog.ceo/api/breeds/list/all");
    const data = await res.json();
    const breeds = Object.keys(data.message);
    breeds.sort((a, b) => a.localeCompare(b));
    await Breed.deleteMany();
    await Breed.insertMany(
      breeds.map((name) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
      })),
    );
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
