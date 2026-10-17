const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Photo = require("../../models/Photo");
const { errorResponse, reportError } = require("../../utils/errors");
const { notify } = require("../../utils/notify");

const toggleLike = async (Model, id, userId) => {
  const likedDoc = await Model.findOneAndUpdate(
    { _id: id, likes: { $ne: userId } },
    { $addToSet: { likes: userId } },
    { new: true },
  );
  if (likedDoc)
    return {
      liked: true,
      count: likedDoc.likes.length,
      ownerId: likedDoc.user,
    };

  const unlikedDoc = await Model.findOneAndUpdate(
    { _id: id, likes: userId },
    { $pull: { likes: userId } },
    { new: true },
  );
  if (unlikedDoc)
    return {
      liked: false,
      count: unlikedDoc.likes.length,
      ownerId: unlikedDoc.user,
    };

  return null;
};

const likeHandler = (Model, type) => async (req, res) => {
  try {
    const result = await toggleLike(Model, req.params.id, req.user.id);
    if (!result) return res.status(404).json(errorResponse("NOT_FOUND"));
    const { liked, count, ownerId } = result;
    if (liked) await notify({ recipient: ownerId, user: req.user.id, type });
    res.json({ liked, count });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = {
  likePost: likeHandler(Post, "like"),
  likeComment: likeHandler(Comment, "like"),
  likePhoto: likeHandler(Photo, "like"),
};
