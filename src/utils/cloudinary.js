const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) =>
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) =>
        err ? reject(err) : resolve(result),
      )
      .end(buffer),
  );

const isOwnCloudinaryUrl = (url) =>
  typeof url === "string" &&
  url.startsWith(
    `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
  );

module.exports = { cloudinary, uploadToCloudinary, isOwnCloudinaryUrl };
