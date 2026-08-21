const User = require("../models/User");
const { notify } = require("./notify");

const awardFirstFriendAchievement = async (userId) => {
  const user = await User.findById(userId);

  if (user.achievements.firstFriend) {
    return;
  }

  user.achievements.firstFriend = true;
  await user.save();

  await notify({ recipient: userId, user: null, type: "achievement" });
};

const grantFirstFriendAchievements = async (userId, friendId) => {
  await awardFirstFriendAchievement(userId);
  await awardFirstFriendAchievement(friendId);
};

module.exports = { grantFirstFriendAchievements };
