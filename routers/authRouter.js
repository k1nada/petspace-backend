const Router = require("express");
const router = new Router();
const authController = require('../controllers/authController');
const { check } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/signup",
  [
    check("username", "The username can't be empty").notEmpty(),
    check("email", "Invalid email").isEmail(),
    check(
      "password",
      "The password can`t be less than 8 and more that 64 characters",
    ).isLength({ min: 8, max: 64 }),
  ],
  authController.signup,
);
router.post("/signin", authController.signin);

router.get("/users", authController.getUsers);
router.get("/user/:username", authController.getUser);
router.put("/user/:username", authMiddleware, authController.updateUser);
router.patch(
  "/registrationsSteps",
  authMiddleware,
  authController.registrationsSteps,
);

module.exports = router;