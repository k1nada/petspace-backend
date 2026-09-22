const Router = require("express");
const router = new Router();
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../../middleware/authMiddleware");
const {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  removeFollower,
} = require("./followsController");

router.get("/followers/:username", optionalAuthMiddleware, getFollowers);
router.get("/following/:username", optionalAuthMiddleware, getFollowing);
router.post("/following/:username/:targetUsername", authMiddleware, followUser);
router.delete(
  "/following/:username/:targetUsername",
  authMiddleware,
  unfollowUser,
);
router.delete(
  "/followers/:username/:followerUsername",
  authMiddleware,
  removeFollower,
);

module.exports = router;
