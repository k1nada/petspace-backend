const Router = require("express");
const router = new Router();
const {
  getFriends,
  addFriend,
  removeFriend,
} = require("../controllers/friendsController");

router.get("/:username", getFriends);
router.post("/:username/add/:friendUsername", addFriend);
router.delete("/:username/remove/:friendUsername", removeFriend);

module.exports = router;
