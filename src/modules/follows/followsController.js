const User = require("../../models/User");
const { errorResponse, reportError } = require("../../utils/errors");
const { resolveActingUserPair } = require("../../utils/findUsers");

const PUBLIC_FIELDS = "username name avatar isOnline lastSeen followers";

const withFollowersCount = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  avatar: user.avatar,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  followersCount: user.followers.length,
});

const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).populate("followers", PUBLIC_FIELDS);

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.followers.map(withFollowersCount));
  } catch (err) {
    reportError(err, res);
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).populate("following", PUBLIC_FIELDS);

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.following.map(withFollowersCount));
  } catch (err) {
    reportError(err, res);
  }
};

const followUser = async (req, res) => {
  try {
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

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { following: target._id },
    });
    await User.findByIdAndUpdate(target._id, {
      $addToSet: { followers: user._id },
    });

    res.json({ message: "Now following" });
  } catch (err) {
    reportError(err, res);
  }
};

const unfollowUser = async (req, res) => {
  try {
    const pair = await resolveActingUserPair(req, res, "targetUsername");
    if (!pair) return;
    const { user, other: target } = pair;

    await User.findByIdAndUpdate(user._id, {
      $pull: { following: target._id },
    });
    await User.findByIdAndUpdate(target._id, {
      $pull: { followers: user._id },
    });

    res.json({ message: "Unfollowed" });
  } catch (err) {
    reportError(err, res);
  }
};

const removeFollower = async (req, res) => {
  try {
    const pair = await resolveActingUserPair(req, res, "followerUsername");
    if (!pair) return;
    const { user, other: follower } = pair;

    await User.findByIdAndUpdate(user._id, {
      $pull: { followers: follower._id },
    });
    await User.findByIdAndUpdate(follower._id, {
      $pull: { following: user._id },
    });

    res.json({ message: "Follower removed" });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  removeFollower,
};
