const User = require("../models/User");
const Postwall = require("../models/Postwall");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const { errorResponse } = require("../utils/errors");

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
      password: bcrypt.hashSync(password, 5),
      email,
    });
    await user.save();
    await Postwall.create({ user: user._id });

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        onboardingCompleted: false,
      },
    });
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json(errorResponse("INVALID_CREDENTIALS"));

    res.json({
      token: generateAccessToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getUsers = async (req, res) => {
  try {
    res.json(await User.find());
  } catch {
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
    res.json(user);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const registrationsSteps = async (req, res) => {
  try {
    const { bio, gender, birthDate, country, city, breed } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, gender, birthDate, country, city, breed },
      { new: true },
    );
    res.json(user);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const updateUser = async (req, res) => {
  try {
    const { bio, gender, birthDate, country, city, breed, interests } =
      req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, gender, birthDate, country, city, breed, interests },
      { new: true },
    );
    res.json(user);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = {
  signup,
  signin,
  getUsers,
  getUser,
  registrationsSteps,
  updateUser,
};
