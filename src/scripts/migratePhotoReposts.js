const mongoose = require("mongoose");
const Photo = require("../models/Photo");
const Repost = require("../models/Repost");
require("dotenv").config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    await Repost.syncIndexes();

    const photos = await Photo.collection
      .find({ "reposts.0": { $exists: true } })
      .project({ reposts: 1, updatedAt: 1 })
      .toArray();

    let createdCount = 0;

    for (const photo of photos) {
      for (const userId of photo.reposts) {
        const res = await Repost.updateOne(
          { photo: photo._id, user: userId },
          {
            $setOnInsert: {
              createdAt: photo.updatedAt,
              updatedAt: photo.updatedAt,
            },
          },
          { upsert: true, timestamps: false },
        );
        createdCount += res.upsertedCount;
      }
    }

    await Photo.collection.updateMany({}, { $unset: { reposts: "" } });

    console.log(
      `Created ${createdCount} photo repost(s) from ${photos.length} photo(s)`,
    );
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
