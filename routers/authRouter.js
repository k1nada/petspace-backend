const Router = require("express");
const router = new Router();
const {
  signup,
  signin,
  getUsers,
  getUser,
  updateUser,
  registrationsSteps,
  getMe,
  searchUsers,
  signout,
} = require("../controllers/authController");
const { check } = require("express-validator");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/authMiddleware");

router.post(
  "/signup",
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

router.post("/signin", signin);
router.get("/users", getUsers);
router.get("/user/:username", optionalAuthMiddleware, getUser);
router.get("/me", authMiddleware, getMe);
router.put("/user/:username", authMiddleware, updateUser);
router.patch("/registration-steps", authMiddleware, registrationsSteps);
router.get("/users/search", authMiddleware, searchUsers);
router.post("/signout", authMiddleware, signout);

module.exports = router;
