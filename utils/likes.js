const withLiked = (obj, userId) => ({
  ...obj,
  liked: !!userId && obj.likes.some((id) => id.toString() === userId),
  likesCount: obj.likes.length,
});

module.exports = { withLiked };
