const Router = require("express");
const router = new Router();
const {
  signup,
  signin,
  getUser,
  updateUser,
  registrationsSteps,
  getMe,
  searchUsers,
  signout,
} = require("./authController");
const { check } = require("express-validator");
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../../middleware/authMiddleware");
const {
  authAttemptsLimiter,
  searchLimiter,
} = require("../../middleware/rateLimiter");

router.post(
  "/signup",
  authAttemptsLimiter,
  [
    check("username", "The username can't be empty").notEmpty(),
    check("email", "Invalid email").isEmail(),
    check(
      "password",
      "The password can`t be less than 8 and more than 64 characters",
    ).isLength({ min: 8, max: 64 }),
  ],
  signup,
);

router.post(
  "/signin",
  authAttemptsLimiter,
  [
    check("email", "Invalid email").isEmail(),
    check("password", "Password is required").notEmpty(),
  ],
  signin,
);
router.get("/user/:username", optionalAuthMiddleware, getUser);
router.get("/me", authMiddleware, getMe);
router.put("/user/:username", authMiddleware, updateUser);
router.patch("/registration-steps", authMiddleware, registrationsSteps);
router.get("/users/search", authMiddleware, searchLimiter, searchUsers);
router.post("/signout", authMiddleware, signout);

module.exports = router;
