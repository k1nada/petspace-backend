const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");
const { errorResponse } = require("../utils/errors");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json(errorResponse("TOKEN_INVALID"));

    req.user = jwt.verify(token, secret, { algorithms: ["HS256"] });
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json(errorResponse("TOKEN_EXPIRED"));
    }
    res.status(401).json(errorResponse("TOKEN_INVALID"));
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) req.user = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {}
  next();
};

module.exports = { authMiddleware, optionalAuthMiddleware };
