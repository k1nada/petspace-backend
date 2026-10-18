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

module.exports = { resolveActingUserPair };
