const mongoose = require("mongoose");
const User = require("../../models/User");
const Postwall = require("../../models/Postwall");
const FriendRequest = require("../../models/FriendRequest");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { secret } = require("../../config/config");
const { errorResponse, reportError } = require("../../utils/errors");
const { withLiked } = require("../../utils/likes");
const { withReposted } = require("../../utils/reposts");
const { isUserOnline } = require("../../utils/presence");

const generateAccessToken = (id) =>
  jwt.sign({ id }, secret, { expiresIn: "24h" });

const MAX_SEARCH_RESULTS = 8;
const MIN_SEARCH_LENGTH = 2;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: "Errors", errors });

    const { name, username, password } = req.body;
    const email = req.body.email.trim().toLowerCase();
    if (await User.findOne({ email }))
      return res.status(400).json(errorResponse("EMAIL_ALREADY_EXISTS"));
    if (await User.findOne({ username }))
      return res.status(400).json(errorResponse("USERNAME_ALREADY_EXISTS"));

    const user = new User({
      name,
      username,
      password: bcrypt.hashSync(password, 10),
      email,
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await user.save({ session });
        await Postwall.create([{ user: user._id }], { session });
      });
    } catch (err) {
      if (err.code === 11000) {
        if (err.keyPattern?.email)
          return res.status(400).json(errorResponse("EMAIL_ALREADY_EXISTS"));
        return res.status(400).json(errorResponse("USERNAME_ALREADY_EXISTS"));
      }
      throw err;
    } finally {
      await session.endSession();
    }

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user.id,
        username: user.username,
        registrationCompleted: false,
      },
    });
  } catch (err) {
    reportError(err, res);
  }
};

const signin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: "Errors", errors });

    const { password } = req.body;
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json(errorResponse("INVALID_CREDENTIALS"));

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user.id,
        username: user.username,
        registrationCompleted: user.registrationCompleted,
      },
    });
  } catch (err) {
    reportError(err, res);
  }
};

const signout = (req, res) => {
  res.json({ success: true });
};

const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select({ password: 0, email: 0 })
      .populate({
        path: "photos",
        populate: { path: "user", select: "name avatar" },
      })
      .populate({
        path: "avatarPhotos",
        populate: { path: "user", select: "name avatar" },
      })
      .populate({
        path: "friends",
        select: "name username avatar city breed lastSeen",
      });

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    const userId = req.user?.id;
    const obj = user.toObject({ virtuals: true });
    res.json({
      ...obj,
      isOnline: isUserOnline(user._id),
      friends: obj.friends.map((friend) => ({
        ...friend,
        isOnline: isUserOnline(friend._id),
      })),
      photos: obj.photos.map((photo) =>
        withReposted(withLiked(photo, userId), userId),
      ),
      avatarPhotos: obj.avatarPhotos.map((photo) => withLiked(photo, userId)),
    });
  } catch (err) {
    reportError(err, res);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select({ password: 0, email: 0 })
      .populate({
        path: "friends",
        select: "name username avatar city breed",
      });

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    const sentRequests = await FriendRequest.find({
      from: user._id,
      status: "pending",
    }).distinct("to");

    res.json({ ...user.toJSON(), sentRequests });
  } catch (err) {
    reportError(err, res);
  }
};

const getUsersPresence = async (req, res) => {
  try {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json(errorResponse("INVALID_REQUEST"));
    }

    const ids = req.query.ids.split(",");
    const users = await User.find({ _id: { $in: ids } }).select("lastSeen");
    res.json(
      users.map((user) => ({
        id: user.id,
        isOnline: isUserOnline(user._id),
        lastSeen: user.lastSeen,
      })),
    );
  } catch (err) {
    reportError(err, res);
  }
};

const registrationsSteps = async (req, res) => {
  try {
    const { bio, sex, birthDate, country, city, breed, registrationCompleted } =
      req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, sex, birthDate, country, city, breed, registrationCompleted },
      { new: true, runValidators: true },
    ).select({ password: 0, email: 0 });
    res.json(user);
  } catch (err) {
    reportError(err, res);
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, bio, sex, birthDate, country, city, breed, interests } =
      req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim()))
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

    const update = { name, bio, sex, birthDate, country, city, breed };
    if (interests === null) {
      update.interests = null;
    } else if (interests !== undefined) {
      for (const key of Object.keys(interests)) {
        update[`interests.${key}`] = interests[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    }).select({ password: 0, email: 0 });
    res.json(user);
  } catch (err) {
    reportError(err, res);
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (typeof query !== "string") return res.json([]);

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) return res.json([]);

    const safeQuery = escapeRegex(trimmedQuery);
    const users = await User.find({
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { username: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select("name username avatar")
      .limit(MAX_SEARCH_RESULTS);

    res.json(users);
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = {
  signup,
  signin,
  signout,
  getUser,
  getMe,
  getUsersPresence,
  registrationsSteps,
  updateUser,
  searchUsers,
};
