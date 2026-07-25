const User = require("../models/User");

const findUsersByUsername = (usernames) =>
  Promise.all(usernames.map((u) => User.findOne({ username: u })));

module.exports = { findUsersByUsername };
