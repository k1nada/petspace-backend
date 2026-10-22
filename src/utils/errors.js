const ERROR_CODES = {
  INVALID_CREDENTIALS: 1001,
  TOKEN_EXPIRED: 1002,
  TOKEN_INVALID: 1003,

  EMAIL_ALREADY_EXISTS: 1100,
  USERNAME_ALREADY_EXISTS: 1101,

  USER_NOT_FOUND: 1200,
  POST_NOT_FOUND: 1201,
  PHOTO_NOT_FOUND: 1202,
  COMMENT_NOT_FOUND: 1203,
  NOT_FOUND: 1204,

  ACCESS_DENIED: 1300,

  PHOTO_LIMIT_REACHED: 1502,
  FILE_TOO_LARGE: 1503,

  INTERNAL_SERVER_ERROR: 1600,
  MISSING_REQUIRED_FIELDS: 1601,
  INVALID_REQUEST: 1602,
  TOO_MANY_REQUESTS: 1603,

  ALREADY_FRIENDS: 1700,
  REQUEST_ALREADY_SENT: 1701,
  REQUEST_NOT_FOUND: 1702,

  ALREADY_FOLLOWING: 1900,

  FAMILY_MEMBER_NOT_FOUND: 2000,
  INVALID_RELATION: 2001,
  PARENT_LIMIT_REACHED: 2002,
};

const errorResponse = (errorName) => ({
  code: ERROR_CODES[errorName],
  type: errorName,
});

const reportError = (err, res) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ ...errorResponse("INVALID_REQUEST"), message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ ...errorResponse("FILE_TOO_LARGE"), message: err.message });
    }
    return res
      .status(400)
      .json({ ...errorResponse("INVALID_REQUEST"), message: err.message });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
};

module.exports = { errorResponse, reportError };
