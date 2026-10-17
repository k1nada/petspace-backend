const User = require("../models/User");
const { notify } = require("./notify");

const awardAchievement = async (userId, key) => {
  const updated = await User.findOneAndUpdate(
    { _id: userId, [`achievements.${key}`]: { $ne: true } },
    { $set: { [`achievements.${key}`]: true } },
    { new: true },
  );

  if (!updated) return;

  await notify({ recipient: userId, user: null, type: "achievement" });
};

const grantFirstFriendAchievements = async (userId, friendId) => {
  try {
    await awardAchievement(userId, "firstFriend");
    await awardAchievement(friendId, "firstFriend");
  } catch (err) {
    console.error(err);
  }
};

const awardFirstPostAchievement = async (userId) => {
  try {
    await awardAchievement(userId, "firstPost");
  } catch (err) {
    console.error(err);
  }
};

module.exports = { grantFirstFriendAchievements, awardFirstPostAchievement };
