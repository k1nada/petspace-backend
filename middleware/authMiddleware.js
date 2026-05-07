const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json("error");
    }

    const decoded = jwt.verify(token, secret);
    console.log("decoded:", decoded);
    req.user = decoded;

    next();
  } catch (e) {
    console.log(e);
  }
};

module.exports = authMiddleware;
