const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) req.user = jwt.verify(token, secret);
  } catch {}
  next();
};

module.exports = { authMiddleware, optionalAuthMiddleware };