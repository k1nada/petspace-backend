const { errorResponse } = require("./errors");

const validateContentLength = (content, maxLength, res) => {
  if (typeof content !== "string" || content.length > maxLength) {
    res.status(400).json(errorResponse("INVALID_REQUEST"));
    return false;
  }
  return true;
};

const assertOwner = (ownerId, userId, res) => {
  if (ownerId.toString() !== userId) {
    res.status(403).json(errorResponse("ACCESS_DENIED"));
    return false;
  }
  return true;
};

module.exports = { validateContentLength, assertOwner };
