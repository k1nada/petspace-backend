const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function update() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const res = await User.updateMany(
      { "friends.0": { $exists: true }, "achievements.firstFriend": { $ne: true } },
      { "achievements.firstFriend": true },
    );
    console.log(`Updated ${res.modifiedCount} user(s)`);
    process.exit();
  } catch (e) {
    console.log(e);
  }
}

update();
