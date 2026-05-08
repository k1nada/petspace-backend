const Router = require("express");
const router = new Router();
const upload = require("../middleware/multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  uploadAvatar,
  deleteAvatar,
  uploadPhoto,
  deletePhoto,
} = require("../controllers/photoController");

router.post("/avatar", authMiddleware, upload.single("image"), uploadAvatar);
router.delete("/avatar", authMiddleware, deleteAvatar);
router.post("/photo", authMiddleware, upload.single("image"), uploadPhoto);
router.delete("/photo/:id", authMiddleware, deletePhoto);

module.exports = router;
