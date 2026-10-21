const mongoose = require("mongoose");
const Message = require("../models/Message");
const { isValidRoomId } = require("../utils/chat");
require("dotenv").config();

async function addParticipants() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const roomIds = await Message.distinct("roomId", {
      participants: { $exists: false },
    });

    let updatedCount = 0;
    const skipped = [];

    for (const roomId of roomIds) {
      if (!isValidRoomId(roomId)) {
        skipped.push(roomId);
        continue;
      }

      const res = await Message.updateMany(
        { roomId, participants: { $exists: false } },
        { participants: roomId.split("_") },
      );
      updatedCount += res.modifiedCount;
    }

    console.log(
      `Added participants to ${updatedCount} message(s) in ${roomIds.length - skipped.length} room(s)`,
    );
    if (skipped.length > 0) {
      console.log("Skipped invalid room ids:", skipped);
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addParticipants();
