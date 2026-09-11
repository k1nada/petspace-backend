const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Photo = require("../../models/Photo");
const { errorResponse, reportError } = require("../../utils/errors");
const { notify } = require("../../utils/notify");

const isLikedBy = (doc, userId) =>
  doc.likes.some((id) => id.toString() === userId);

const toggleLike = async (Model, id, userId) => {
  const doc = await Model.findById(id).select("likes user");
  if (!doc) return null;
  const liked = isLikedBy(doc, userId);
  const update = liked
    ? { $pull: { likes: userId } }
    : { $addToSet: { likes: userId } };
  const updated = await Model.findByIdAndUpdate(id, update, { new: true });
  return { liked: !liked, count: updated.likes.length, ownerId: updated.user };
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
