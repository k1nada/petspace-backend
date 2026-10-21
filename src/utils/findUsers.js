const User = require("../models/User");
const { errorResponse } = require("./errors");

const resolveActingUserPair = async (req, res, otherUsernameParam) => {
  const username = req.params.username.toLowerCase();
  const otherUsername = req.params[otherUsernameParam].toLowerCase();

  const user = await User.findOne({ username });
  const other = await User.findOne({ username: otherUsername });

  if (!user || !other) {
    res.status(404).json(errorResponse("USER_NOT_FOUND"));
    return null;
  }

  if (req.user.id !== user._id.toString()) {
    res.status(403).json(errorResponse("ACCESS_DENIED"));
    return null;
  }

  return { user, other };
};

const requireUserByUsername = async (req, res, populate) => {
  let query = User.findOne({ username: req.params.username });
  if (populate) query = query.populate(populate);
  const user = await query;

  if (!user) {
    res.status(404).json(errorResponse("USER_NOT_FOUND"));
    return null;
  }

  return user;
};

const requireSelfByUsername = async (req, res, populate) => {
  const user = await requireUserByUsername(req, res, populate);
  if (!user) return null;

  if (req.user.id !== user._id.toString()) {
    res.status(403).json(errorResponse("ACCESS_DENIED"));
    return null;
  }

  return user;
};

module.exports = {
  resolveActingUserPair,
  requireUserByUsername,
  requireSelfByUsername,
};
