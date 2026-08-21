const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { errorResponse } = require("../utils/errors");
const { findUsersByUsername } = require("../utils/findUsers");
const { notify } = require("../utils/notify");
const { containsId, removeId, follow, unfollow } = require("../utils/friends");
const { grantFirstFriendAchievements } = require("../utils/achievements");

const getFriends = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "friends",
      "username name avatar breed isOnline lastSeen",
    );
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));
    res.json(user.friends);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getSuggestedFriends = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const pendingRequests = await FriendRequest.find({
      status: "pending",
      $or: [{ from: user._id }, { to: user._id }],
    }).select("from to");

    const alreadyConnectedIds = [user._id.toString()];

    for (const friendId of user.friends) {
      alreadyConnectedIds.push(friendId.toString());
    }

    for (const request of pendingRequests) {
      alreadyConnectedIds.push(request.from.toString());
      alreadyConnectedIds.push(request.to.toString());
    }

    const candidates = await User.find(
      { _id: { $nin: alreadyConnectedIds }, name: { $nin: [null, ""] } },
      "name username avatar breed city",
    ).limit(30);

    const matchScore = (candidate) => {
      let score = 0;
      if (candidate.breed === user.breed) score += 2;
      if (candidate.city === user.city) score += 1;
      return score;
    };

    candidates.sort((a, b) => matchScore(b) - matchScore(a));
    const bestMatches = candidates.slice(0, 5);

    res.json(bestMatches);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const addFriend = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const friendUsername = req.params.friendUsername.toLowerCase();

    if (username === friendUsername)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const [user, friend] = await findUsersByUsername([username, friendUsername]);

    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    if (containsId(user.friends, friend._id))
      return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

    const reverseRequest = await FriendRequest.findOne({
      from: friend._id,
      to: user._id,
      status: "pending",
    });

    if (reverseRequest) {
      reverseRequest.status = "accepted";

      user.friends.push(friend._id);
      friend.friends.push(user._id);

      follow(user, friend);
      follow(friend, user);

      await user.save();
      await friend.save();
      await reverseRequest.save();

      await grantFirstFriendAchievements(user._id, friend._id);

      return res.json({ message: "Friend request accepted", friends: true });
    }

    const existingRequest = await FriendRequest.findOne({
      from: user._id,
      to: friend._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.json({ message: "Friend request already sent" });
    }

    const friendRequest = new FriendRequest({
      from: user._id,
      to: friend._id,
    });

    await friendRequest.save();
    await notify({ recipient: friend._id, user: user._id, type: "friendRequest" });

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const deleteFriend = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const friendUsername = req.params.friendUsername.toLowerCase();

    const [user, friend] = await findUsersByUsername([username, friendUsername]);

    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    user.friends = removeId(user.friends, friend._id);
    friend.friends = removeId(friend.friends, user._id);

    unfollow(user, friend);
    unfollow(friend, user);

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest)
      return res.status(404).json(errorResponse("REQUEST_NOT_FOUND"));

    if (friendRequest.to.toString() !== req.user.id) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const user = await User.findById(friendRequest.to);
    const friend = await User.findById(friendRequest.from);

    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (containsId(user.friends, friend._id))
      return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

    user.friends.push(friend._id);
    friend.friends.push(user._id);
    friendRequest.status = "accepted";

    follow(user, friend);
    follow(friend, user);

    await user.save();
    await friend.save();
    await friendRequest.save();

    await grantFirstFriendAchievements(user._id, friend._id);

    await FriendRequest.updateMany(
      {
        _id: { $ne: friendRequest._id },
        status: "pending",
        $or: [
          { from: user._id, to: friend._id },
          { from: friend._id, to: user._id },
        ],
      },
      { status: "accepted" },
    );

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest)
      return res.status(404).json(errorResponse("REQUEST_NOT_FOUND"));

    if (friendRequest.to.toString() !== req.user.id) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const requests = await FriendRequest.find({
      to: user._id,
      status: "pending",
    }).populate("from", "username name avatar");

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = {
  getFriends,
  getSuggestedFriends,
  addFriend,
  deleteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
};
