const User = require("../models/User");
const { errorResponse } = require("../utils/errors");
const { findUsersByUsername } = require("../utils/findUsers");

const PUBLIC_FIELDS = "username name avatar isOnline lastSeen";

const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).populate("followers", PUBLIC_FIELDS);

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.followers);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).populate("following", PUBLIC_FIELDS);

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.following);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const followUser = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const targetUsername = req.params.targetUsername.toLowerCase();

    if (username === targetUsername)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const [user, target] = await findUsersByUsername([username, targetUsername]);

    if (!user || !target)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    if (user.following.some((id) => id.equals(target._id)))
      return res.status(400).json(errorResponse("ALREADY_FOLLOWING"));

    user.following.push(target._id);
    target.followers.push(user._id);

    await user.save();
    await target.save();

    res.json({ message: "Now following" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const unfollowUser = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const targetUsername = req.params.targetUsername.toLowerCase();

    const [user, target] = await findUsersByUsername([username, targetUsername]);

    if (!user || !target)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    user.following = user.following.filter((id) => !id.equals(target._id));
    target.followers = target.followers.filter((id) => !id.equals(user._id));

    await user.save();
    await target.save();

    res.json({ message: "Unfollowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const removeFollower = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const followerUsername = req.params.followerUsername.toLowerCase();

    const [user, follower] = await findUsersByUsername([username, followerUsername]);

    if (!user || !follower)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    user.followers = user.followers.filter((id) => !id.equals(follower._id));
    follower.following = follower.following.filter(
      (id) => !id.equals(user._id),
    );

    await user.save();
    await follower.save();

    res.json({ message: "Follower removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  removeFollower,
};
