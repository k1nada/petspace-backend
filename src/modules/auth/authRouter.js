const Router = require("express");
const router = new Router();
const {
  signup,
  signin,
  getUser,
  updateUser,
  registrationsSteps,
  getMe,
  getUsersPresence,
  searchUsers,
  signout,
} = require("./authController");
const { check, query } = require("express-validator");
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../../middleware/authMiddleware");
const {
  authAttemptsLimiter,
  searchLimiter,
} = require("../../middleware/rateLimiter");

const MAX_PRESENCE_IDS = 200;
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/;

router.post(
  "/signup",
  authAttemptsLimiter,
  [
    check("username", "Invalid username")
      .trim()
      .toLowerCase()
      .matches(/^[a-z0-9_]{3,20}$/),
    check("name", "Invalid name").trim().isLength({ min: 3, max: 20 }),
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
router.get(
  "/users/presence",
  authMiddleware,
  [
    query("ids")
      .isString()
      .custom((value) => {
        const ids = value.split(",");
        return (
          ids.length <= MAX_PRESENCE_IDS &&
          ids.every((id) => OBJECT_ID_PATTERN.test(id))
        );
      }),
  ],
  getUsersPresence,
);

module.exports = router;
