const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { errorResponse } = require("../utils/errors");
const { findUsersByUsername } = require("../utils/findUsers");

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

    if (user.friends.some((id) => id.equals(friend._id)))
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

      if (!user.following.some((id) => id.equals(friend._id))) {
        user.following.push(friend._id);
        friend.followers.push(user._id);
      }
      if (!friend.following.some((id) => id.equals(user._id))) {
        friend.following.push(user._id);
        user.followers.push(friend._id);
      }

      await user.save();
      await friend.save();
      await reverseRequest.save();

      return res.json({ message: "Friend request accepted", friends: true });
    }

    const existingRequest = await FriendRequest.findOne({
      from: user._id,
      to: friend._id,
      status: "pending",
    });

    if (existingRequest) {
      if (!user.following.some((id) => id.equals(friend._id))) {
        user.following.push(friend._id);
        friend.followers.push(user._id);
        await user.save();
        await friend.save();
      }
      return res.json({ message: "Friend request already sent" });
    }

    const friendRequest = new FriendRequest({
      from: user._id,
      to: friend._id,
    });

    await friendRequest.save();

    if (!user.following.some((id) => id.equals(friend._id))) {
      user.following.push(friend._id);
      friend.followers.push(user._id);
      await user.save();
      await friend.save();
    }

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

    user.friends = user.friends.filter((id) => !id.equals(friend._id));
    friend.friends = friend.friends.filter((id) => !id.equals(user._id));

    friend.following = friend.following.filter((id) => !id.equals(user._id));
    user.followers = user.followers.filter((id) => !id.equals(friend._id));

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

    if (user.friends.some((id) => id.equals(friend._id)))
      return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

    user.friends.push(friend._id);
    friend.friends.push(user._id);
    friendRequest.status = "accepted";

    await user.save();
    await friend.save();
    await friendRequest.save();

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
  addFriend,
  deleteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
};
