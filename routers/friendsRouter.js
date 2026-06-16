const Router = require("express");
const router = new Router();
const {
  getFriends,
  addFriend,
  deleteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
} = require("../controllers/friendsController");

router.get("/:username", getFriends);
router.post("/:username/add/:friendUsername", addFriend);
router.delete("/:username/delete/:friendUsername", deleteFriend);
router.post("/request/:requestId/accept", acceptFriendRequest);
router.post("/request/:requestId/reject", rejectFriendRequest);
router.get("/requests/:username/pending", getPendingRequests);

module.exports = router;
