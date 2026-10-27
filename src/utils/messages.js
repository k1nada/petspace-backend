const { withLiked } = require("./likes");
const { withReposted } = require("./reposts");

const MESSAGE_POPULATE = [
  { path: "sender", select: "username name avatar" },
  {
    path: "post",
    select: "content image user createdAt",
    populate: { path: "user", select: "name avatar username" },
  },
  {
    path: "photo",
    select: "publicId user createdAt likes reposts",
    populate: { path: "user", select: "name avatar username" },
  },
];

const serializeMessage = (message, userId) => {
  const json = message.toJSON();
  if (!json.photo) return json;

  const photo = withReposted(withLiked(json.photo, userId), userId);
  return {
    ...json,
    photo: {
      id: photo.id,
      publicId: photo.publicId,
      createdAt: photo.createdAt,
      user: photo.user,
      liked: photo.liked,
      likesCount: photo.likesCount,
      reposted: photo.reposted,
      repostsCount: photo.repostsCount,
    },
  };
};

module.exports = { MESSAGE_POPULATE, serializeMessage };
