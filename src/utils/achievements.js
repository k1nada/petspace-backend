const User = require("../models/User");
const { notify } = require("./notify");

const awardAchievement = async (userId, key) => {
  const user = await User.findById(userId);

  if (user.achievements[key]) {
    return;
  }

  user.achievements[key] = true;
  await user.save();

  await notify({ recipient: userId, user: null, type: "achievement" });
};

const grantFirstFriendAchievements = async (userId, friendId) => {
  await awardAchievement(userId, "firstFriend");
  await awardAchievement(friendId, "firstFriend");
};

const awardFirstPostAchievement = async (userId) => {
  await awardAchievement(userId, "firstPost");
};

module.exports = { grantFirstFriendAchievements, awardFirstPostAchievement };
