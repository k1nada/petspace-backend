const Router = require("express");
const router = new Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getFriends,
  addFriend,
  deleteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
} = require("../controllers/friendsController");

router.get("/:username", getFriends);
router.post("/:username/add/:friendUsername", authMiddleware, addFriend);
router.delete(
  "/:username/delete/:friendUsername",
  authMiddleware,
  deleteFriend,
);
router.post("/request/:requestId/accept", authMiddleware, acceptFriendRequest);
router.post("/request/:requestId/reject", authMiddleware, rejectFriendRequest);
router.get("/requests/:username/pending", authMiddleware, getPendingRequests);

module.exports = router;
