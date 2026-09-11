const mongoose = require("mongoose");
const Repost = require("../models/Repost");
require("dotenv").config();

async function dedupe() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const duplicates = await Repost.aggregate([
      {
        $group: {
          _id: { user: "$user", post: "$post" },
          ids: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    let deletedCount = 0;
    for (const group of duplicates) {
      const [, ...extraIds] = group.ids;
      const res = await Repost.deleteMany({ _id: { $in: extraIds } });
      deletedCount += res.deletedCount;
    }

    console.log(
      `Removed ${deletedCount} duplicate repost(s) across ${duplicates.length} pair(s)`,
    );
    process.exit();
  } catch (err) {
    console.error(err);
  }
}

dedupe();
