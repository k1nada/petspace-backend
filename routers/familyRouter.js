const Router = require("express");
const router = new Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const familyController = require("../controllers/familyController");

router.get("/:username", familyController.getFamily);
router.post("/", authMiddleware, familyController.addFamilyMember);
router.delete(
  "/:memberId",
  authMiddleware,
  familyController.deleteFamilyMember,
);

module.exports = router;
