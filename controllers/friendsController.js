const User = require("../models/User");
const { errorResponse } = require("../utils/errors");

const getUsers = async (usernames) => {
  const users = await Promise.all(
    usernames.map((u) => User.findOne({ username: u })),
  );
  return users;
};

const getFriends = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "friends",
    );
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.friends);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const addFriend = async (req, res) => {
  try {
    const [user, friend] = await getUsers([
      req.params.username,
      req.params.friendUsername,
    ]);
    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    if (user.friends.includes(friend._id))
      return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

    user.friends.push(friend._id);
    user.achievements.firstFriend = true;
    await user.save();
    res.json({ message: "Friend added" });
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const removeFriend = async (req, res) => {
  try {
    const [user, friend] = await getUsers([
      req.params.username,
      req.params.friendUsername,
    ]);
    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    user.friends = user.friends.filter((id) => !id.equals(friend._id));
    await user.save();
    res.json({ message: "Friend removed" });
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { getFriends, addFriend, removeFriend };