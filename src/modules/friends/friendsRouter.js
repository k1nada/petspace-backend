const Router = require("express");
const router = new Router();
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../../middleware/authMiddleware");
const {
  getFriends,
  getSuggestedFriends,
  addFriend,
  deleteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
} = require("./friendsController");

router.get("/:username/suggestions", authMiddleware, getSuggestedFriends);
router.get("/:username", optionalAuthMiddleware, getFriends);
router.post("/:username/:friendUsername", authMiddleware, addFriend);
router.delete("/:username/:friendUsername", authMiddleware, deleteFriend);
router.post("/request/:requestId/accept", authMiddleware, acceptFriendRequest);
router.post("/request/:requestId/reject", authMiddleware, rejectFriendRequest);
router.get("/requests/:username/pending", authMiddleware, getPendingRequests);

module.exports = router;
