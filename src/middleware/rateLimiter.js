const rateLimit = require("express-rate-limit");

const isInternalRequest = (req) =>
  !!process.env.INTERNAL_API_KEY &&
  req.get("x-internal-key") === process.env.INTERNAL_API_KEY;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isInternalRequest,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const authAttemptsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authAttemptsLimiter, searchLimiter };
