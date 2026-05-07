const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (token) {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };