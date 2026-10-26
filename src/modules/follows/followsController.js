const mongoose = require("mongoose");
const User = require("../../models/User");
const { errorResponse } = require("../../utils/errors");
const { resolveActingUserPair } = require("../../utils/findUsers");

const PUBLIC_FIELDS = "username name avatar followers";

const withFollowersCount = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  avatar: user.avatar,
  followersCount: user.followers.length,
});

const getFollowers = async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
  }).populate("followers", PUBLIC_FIELDS);

  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
  res.json(user.followers.map(withFollowersCount));
};

const getFollowing = async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
  }).populate("following", PUBLIC_FIELDS);

  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
  res.json(user.following.map(withFollowersCount));
};

const followUser = async (req, res) => {
  if (
    req.params.username.toLowerCase() ===
    req.params.targetUsername.toLowerCase()
  )
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  const pair = await resolveActingUserPair(req, res, "targetUsername");
  if (!pair) return;
  const { user, other: target } = pair;

  if (user.following.some((id) => id.equals(target._id)))
    return res.status(400).json(errorResponse("ALREADY_FOLLOWING"));

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { following: target._id } },
        { session },
      );
      await User.findByIdAndUpdate(
        target._id,
        { $addToSet: { followers: user._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Now following" });
};

const unfollowUser = async (req, res) => {
  const pair = await resolveActingUserPair(req, res, "targetUsername");
  if (!pair) return;
  const { user, other: target } = pair;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { following: target._id } },
        { session },
      );
      await User.findByIdAndUpdate(
        target._id,
        { $pull: { followers: user._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Unfollowed" });
};

const removeFollower = async (req, res) => {
  const pair = await resolveActingUserPair(req, res, "followerUsername");
  if (!pair) return;
  const { user, other: follower } = pair;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { followers: follower._id } },
        { session },
      );
      await User.findByIdAndUpdate(
        follower._id,
        { $pull: { following: user._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Follower removed" });
};

module.exports = {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  removeFollower,
};
