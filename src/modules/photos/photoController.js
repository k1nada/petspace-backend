const mongoose = require("mongoose");
const { cloudinary, uploadToCloudinary } = require("../../utils/cloudinary");
const User = require("../../models/User");
const Photo = require("../../models/Photo");
const { errorResponse, reportError } = require("../../utils/errors");

const MAX_PHOTOS_PER_USER = 300;

const buildAvatarUrl = (publicId) =>
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_256,h_256,c_fill,g_face/${publicId}`;

const findPreviousAvatarUrl = async (avatarPhotoIds, session) => {
  const previousAvatarPhotoId = avatarPhotoIds.at(-1);
  if (!previousAvatarPhotoId) return null;

  const previousAvatarPhoto = await Photo.findById(
    previousAvatarPhotoId,
  ).session(session);
  if (!previousAvatarPhoto) return null;

  return buildAvatarUrl(previousAvatarPhoto.publicId);
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const photoCount = await Photo.countDocuments({ user: req.user.id });
    if (photoCount >= MAX_PHOTOS_PER_USER)
      return res.status(400).json(errorResponse("PHOTO_LIMIT_REACHED"));

    const result = await uploadToCloudinary(req.file.buffer, "my-app/avatars");
    const optimizedUrl = result.secure_url.replace(
      "/upload/",
      "/upload/w_256,h_256,c_fill,g_face/",
    );
    const photo = await Photo.create({
      publicId: result.public_id,
      user: req.user.id,
    });

    await User.findByIdAndUpdate(req.user.id, {
      avatar: optimizedUrl,
      $push: { avatarPhotos: photo._id, photos: photo._id },
    });

    res.json({
      data: {
        url: optimizedUrl,
        public_id: result.public_id,
        photoId: photo._id,
      },
    });
  } catch (err) {
    reportError(err, res);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const photoCount = await Photo.countDocuments({ user: req.user.id });
    if (photoCount >= MAX_PHOTOS_PER_USER)
      return res.status(400).json(errorResponse("PHOTO_LIMIT_REACHED"));

    const result = await uploadToCloudinary(req.file.buffer, "my-app/photos");
    const photo = await Photo.create({
      publicId: result.public_id,
      user: req.user.id,
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { photos: photo._id } });

    res.json({
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        _id: photo._id,
        createdAt: photo.createdAt,
      },
    });
  } catch (err) {
    reportError(err, res);
  }
};

const deletePhoto = async (req, res) => {
  try {
    let photo;
    let isCurrentAvatar;
    let newAvatarUrl;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        photo = await Photo.findOneAndDelete({
          _id: req.params.id,
          user: req.user.id,
        }).session(session);
        if (!photo) return;

        const user = await User.findById(req.user.id).session(session);
        const lastAvatarPhotoId = user.avatarPhotos.at(-1);
        isCurrentAvatar =
          lastAvatarPhotoId?.toString() === photo._id.toString();

        const remainingPhotoIds = user.photos.filter(
          (id) => id.toString() !== photo._id.toString(),
        );
        const remainingAvatarPhotoIds = user.avatarPhotos.filter(
          (id) => id.toString() !== photo._id.toString(),
        );

        const update = {
          photos: remainingPhotoIds,
          avatarPhotos: remainingAvatarPhotoIds,
        };

        if (isCurrentAvatar) {
          newAvatarUrl = await findPreviousAvatarUrl(
            remainingAvatarPhotoIds,
            session,
          );
          update.avatar = newAvatarUrl;
        }

        await User.findByIdAndUpdate(req.user.id, update, { session });
      });
    } finally {
      await session.endSession();
    }

    if (!photo) return res.status(404).json(errorResponse("PHOTO_NOT_FOUND"));

    await cloudinary.uploader.destroy(photo.publicId);

    res.json({
      data: { avatarChanged: isCurrentAvatar, avatar: newAvatarUrl ?? null },
    });
  } catch (err) {
    reportError(err, res);
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const lastPhoto = user.avatarPhotos?.length
      ? await Photo.findByIdAndDelete(user.avatarPhotos.at(-1))
      : null;

    if (lastPhoto) {
      await Promise.all([
        cloudinary.uploader.destroy(lastPhoto.publicId),
        User.findByIdAndUpdate(req.user.id, {
          avatar: null,
          $pull: { avatarPhotos: lastPhoto._id, photos: lastPhoto._id },
        }),
      ]);
    } else {
      await User.findByIdAndUpdate(req.user.id, { avatar: null });
    }

    res.json({ data: { success: true } });
  } catch (err) {
    reportError(err, res);
  }
};

const uploadFamilyAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const result = await uploadToCloudinary(req.file.buffer, "my-app/family");

    res.json({ data: { url: buildAvatarUrl(result.public_id) } });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = {
  uploadAvatar,
  uploadPhoto,
  deletePhoto,
  deleteAvatar,
  uploadFamilyAvatar,
};
