const User = require("../models/User");

const containsId = (list, id) => {
  for (const item of list) {
    if (item.toString() === id.toString()) return true;
  }
  return false;
};

const linkAsFriends = async (userId, friendId, session) => {
  await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        friends: friendId,
        following: friendId,
        followers: friendId,
      },
    },
    { session },
  );
  await User.findByIdAndUpdate(
    friendId,
    {
      $addToSet: {
        friends: userId,
        following: userId,
        followers: userId,
      },
    },
    { session },
  );
};

const unlinkAsFriends = async (userId, friendId, session) => {
  await User.findByIdAndUpdate(
    userId,
    {
      $pull: {
        friends: friendId,
        following: friendId,
        followers: friendId,
      },
    },
    { session },
  );
  await User.findByIdAndUpdate(
    friendId,
    {
      $pull: {
        friends: userId,
        following: userId,
        followers: userId,
      },
    },
    { session },
  );
};

module.exports = { containsId, linkAsFriends, unlinkAsFriends };
