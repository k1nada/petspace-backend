const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
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
    const username = req.params.username.toLowerCase();
    const friendUsername = req.params.friendUsername.toLowerCase();

    if (username === friendUsername)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const [user, friend] = await getUsers([username, friendUsername]);

    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (user.friends.some((id) => id.equals(friend._id)))
      return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

    const existingRequest = await FriendRequest.findOne({
      from: user._id,
      to: friend._id,
      status: "pending",
    });

    if (existingRequest)
      return res.status(400).json(errorResponse("REQUEST_ALREADY_SENT"));

    const friendRequest = new FriendRequest({
      from: user._id,
      to: friend._id,
    });

    await friendRequest.save();
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

    const currentUser = req.user;
    if (currentUser.username !== username) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const [user, friend] = await getUsers([username, friendUsername]);

    if (!user || !friend)
      return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    user.friends = user.friends.filter((id) => !id.equals(friend._id));
    friend.friends = friend.friends.filter((id) => !id.equals(user._id));

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
