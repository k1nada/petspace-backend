const mongoose = require("mongoose");
const User = require("../../models/User");
const FriendRequest = require("../../models/FriendRequest");
const { errorResponse } = require("../../utils/errors");
const {
  resolveActingUserPair,
  requireSelfByUsername,
  requireUserByUsername,
} = require("../../utils/findUsers");
const { notify } = require("../../utils/notify");
const {
  containsId,
  linkAsFriends,
  unlinkAsFriends,
} = require("../../utils/friends");
const { grantFirstFriendAchievements } = require("../../utils/achievements");
const { isUserOnline } = require("../../utils/presence");

const SUGGESTED_FRIENDS_CANDIDATE_POOL = 30;
const SUGGESTED_FRIENDS_RESULT_COUNT = 5;

const getFriends = async (req, res) => {
  const user = await requireUserByUsername(req, res, {
    path: "friends",
    select: "username name avatar breed lastSeen",
  });
  if (!user) return;
  res.json(
    user.friends.map((friend) => ({
      ...friend.toJSON(),
      isOnline: isUserOnline(friend._id),
    })),
  );
};

const getSuggestedFriends = async (req, res) => {
  const user = await requireSelfByUsername(req, res);
  if (!user) return;

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
  ).limit(SUGGESTED_FRIENDS_CANDIDATE_POOL);

  const matchScore = (candidate) => {
    let score = 0;
    if (user.breed && candidate.breed === user.breed) score += 2;
    if (user.city && candidate.city === user.city) score += 1;
    return score;
  };

  candidates.sort((a, b) => matchScore(b) - matchScore(a));
  const bestMatches = candidates.slice(0, SUGGESTED_FRIENDS_RESULT_COUNT);

  res.json(bestMatches);
};

const addFriend = async (req, res) => {
  if (
    req.params.username.toLowerCase() ===
    req.params.friendUsername.toLowerCase()
  )
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  const pair = await resolveActingUserPair(req, res, "friendUsername");
  if (!pair) return;
  const { user, other: friend } = pair;

  if (containsId(user.friends, friend._id))
    return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

  const reverseRequest = await FriendRequest.findOne({
    from: friend._id,
    to: user._id,
    status: "pending",
  });

  if (reverseRequest) {
    reverseRequest.status = "accepted";

    const acceptSession = await mongoose.startSession();
    try {
      await acceptSession.withTransaction(async () => {
        await linkAsFriends(user._id, friend._id, acceptSession);
        await reverseRequest.save({ session: acceptSession });
      });
    } finally {
      await acceptSession.endSession();
    }

    await grantFirstFriendAchievements(user._id, friend._id);

    return res.json({ message: "Friend request accepted", friends: true });
  }

  const existingRequest = await FriendRequest.findOne({
    from: user._id,
    to: friend._id,
    status: "pending",
  });

  if (existingRequest) {
    return res.status(400).json(errorResponse("REQUEST_ALREADY_SENT"));
  }

  const friendRequest = new FriendRequest({
    from: user._id,
    to: friend._id,
  });

  const requestSession = await mongoose.startSession();
  try {
    await requestSession.withTransaction(async () => {
      await friendRequest.save({ session: requestSession });
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { following: friend._id } },
        { session: requestSession },
      );
      await User.findByIdAndUpdate(
        friend._id,
        { $addToSet: { followers: user._id } },
        { session: requestSession },
      );
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json(errorResponse("REQUEST_ALREADY_SENT"));
    }
    throw err;
  } finally {
    await requestSession.endSession();
  }

  await notify({
    recipient: friend._id,
    user: user._id,
    type: "friendRequest",
  });

  res.json({ message: "Friend request sent" });
};

const deleteFriend = async (req, res) => {
  const pair = await resolveActingUserPair(req, res, "friendUsername");
  if (!pair) return;
  const { user, other: friend } = pair;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await unlinkAsFriends(user._id, friend._id, session);
      await FriendRequest.deleteMany({
        status: "pending",
        $or: [
          { from: user._id, to: friend._id },
          { from: friend._id, to: user._id },
        ],
      }).session(session);
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Friend removed" });
};

const acceptFriendRequest = async (res, friendRequest) => {
  const user = await User.findById(friendRequest.to);
  const friend = await User.findById(friendRequest.from);

  if (!user || !friend)
    return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  if (containsId(user.friends, friend._id))
    return res.status(400).json(errorResponse("ALREADY_FRIENDS"));

  friendRequest.status = "accepted";

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await linkAsFriends(user._id, friend._id, session);
      await friendRequest.save({ session });
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
      ).session(session);
    });
  } finally {
    await session.endSession();
  }

  await grantFirstFriendAchievements(user._id, friend._id);

  res.json({ message: "Friend request accepted" });
};

const rejectFriendRequest = async (res, friendRequest) => {
  const sender = await User.findById(friendRequest.from);
  const receiver = await User.findById(friendRequest.to);

  friendRequest.status = "rejected";

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (sender && receiver) {
        await User.findByIdAndUpdate(
          sender._id,
          { $pull: { following: receiver._id } },
          { session },
        );
        await User.findByIdAndUpdate(
          receiver._id,
          { $pull: { followers: sender._id } },
          { session },
        );
      }
      await friendRequest.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Friend request rejected" });
};

const respondToFriendRequest = async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status))
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  const friendRequest = await FriendRequest.findById(req.params.requestId);

  if (!friendRequest)
    return res.status(404).json(errorResponse("REQUEST_NOT_FOUND"));

  if (friendRequest.to.toString() !== req.user.id) {
    return res.status(403).json(errorResponse("ACCESS_DENIED"));
  }

  if (friendRequest.status !== "pending") {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  if (status === "accepted") {
    await acceptFriendRequest(res, friendRequest);
  } else {
    await rejectFriendRequest(res, friendRequest);
  }
};

const getPendingRequests = async (req, res) => {
  const user = await requireSelfByUsername(req, res);
  if (!user) return;

  const requests = await FriendRequest.find({
    to: user._id,
    status: "pending",
  }).populate("from", "username name avatar");

  res.json(requests);
};

module.exports = {
  getFriends,
  getSuggestedFriends,
  addFriend,
  deleteFriend,
  respondToFriendRequest,
  getPendingRequests,
};
