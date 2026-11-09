const { withLiked } = require("./likes");
const { getRepostInfo } = require("./reposts");

const MESSAGE_POPULATE = [
  { path: "sender", select: "username name avatar" },
  {
    path: "post",
    select: "content image user createdAt",
    populate: { path: "user", select: "name avatar username" },
  },
  {
    path: "photo",
    select: "publicId user createdAt likes",
    populate: { path: "user", select: "name avatar username" },
  },
];

const serializeMessage = (message, userId, photoReposts = []) => {
  const json = message.toJSON();
  if (!json.photo) return json;

  const photo = {
    ...withLiked(json.photo, userId),
    ...getRepostInfo(json.photo._id, photoReposts, userId),
  };
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
