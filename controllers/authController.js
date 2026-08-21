const User = require("../models/User");
const Postwall = require("../models/Postwall");
const FriendRequest = require("../models/FriendRequest");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const { errorResponse } = require("../utils/errors");
const { withLiked } = require("../utils/likes");

const generateAccessToken = (id) =>
  jwt.sign({ id }, secret, { expiresIn: "24h" });

const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: "Errors", errors });

    const { name, username, password, email } = req.body;
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
    await user.save();
    await Postwall.create({ user: user._id });

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user.id,
        username: user.username,
        onboardingCompleted: false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json(errorResponse("INVALID_CREDENTIALS"));

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user.id,
        username: user.username,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const signout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getUsers = async (req, res) => {
  try {
    res.json(await User.find().select({ password: 0, email: 0 }));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
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
      .populate({ path: "friends", select: "name username avatar city breed" });

    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    const userId = req.user?.id;
    const obj = user.toObject();
    res.json({
      ...obj,
      photos: obj.photos.map((photo) => withLiked(photo, userId)),
      avatarPhotos: obj.avatarPhotos.map((photo) => withLiked(photo, userId)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
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
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const registrationsSteps = async (req, res) => {
  try {
    const { bio, sex, birthDate, country, city, breed } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, sex, birthDate, country, city, breed },
      { new: true },
    );
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, bio, sex, birthDate, country, city, breed, interests } =
      req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, sex, birthDate, country, city, breed, interests },
      { new: true },
    );
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("name username avatar")
      .limit(10);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = {
  signup,
  signin,
  signout,
  getUsers,
  getUser,
  getMe,
  registrationsSteps,
  updateUser,
  searchUsers,
};
