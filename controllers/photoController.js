const cloudinary = require("../utils/cloudinary");
const User = require("../models/User");
const Photo = require("../models/Photo");
const { errorResponse } = require("../utils/errors");

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) =>
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer)
  );

const createPhoto = async (publicId, userId) => {
  const photo = await Photo.create({ publicId, user: userId });
  return photo;
};

const uploadAvatar = async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, "my-app/avatars");
    const optimizedUrl = result.secure_url.replace("/upload/", "/upload/w_256,h_256,c_fill,g_face/");
    const photo = await createPhoto(result.public_id, req.user.id);

    await User.findByIdAndUpdate(req.user.id, {
      avatar: optimizedUrl,
      $push: { avatarPhotos: photo._id, photos: photo._id },
    });

    res.json({ data: { url: optimizedUrl, public_id: result.public_id, photoId: photo._id } });
  } catch {
    res.status(500).json(errorResponse("UPLOAD_FAILED"));
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, "my-app/photos");
    const photo = await createPhoto(result.public_id, req.user.id);

    await User.findByIdAndUpdate(req.user.id, { $push: { photos: photo._id } });

    res.json({ data: { url: result.secure_url, public_id: result.public_id, _id: photo._id, createdAt: photo.createdAt } });
  } catch {
    res.status(500).json(errorResponse("UPLOAD_FAILED"));
  }
};

const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!photo) return res.status(404).json(errorResponse("PHOTO_NOT_FOUND"));

    await Promise.all([
      User.findByIdAndUpdate(req.user.id, { $pull: { photos: photo._id } }),
      cloudinary.uploader.destroy(photo.publicId),
    ]);

    res.json({ data: { success: true } });
  } catch {
    res.status(500).json(errorResponse("DELETE_FAILED"));
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
  } catch {
    res.status(500).json(errorResponse("DELETE_FAILED"));
  }
};

module.exports = { uploadAvatar, uploadPhoto, deletePhoto, deleteAvatar };