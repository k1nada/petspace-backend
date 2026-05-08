const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { errorResponse } = require("../utils/errors");

const toggleLike = async (Model, id, userId) => {
  const doc = await Model.findById(id);
  if (!doc) return null;
  const liked = doc.likes.includes(userId);
  liked ? doc.likes.pull(userId) : doc.likes.push(userId);
  await doc.save();
  return { liked: !liked, count: doc.likes.length };
};

const getLikeStatus = async (Model, id, userId) => {
  const doc = await Model.findById(id);
  if (!doc) return null;
  return { liked: doc.likes.includes(userId), count: doc.likes.length };
};

const likeHandler = (Model) => async (req, res) => {
  try {
    const result = await toggleLike(Model, req.params.id, req.user.id);
    if (!result) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json(result);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const likeStatusHandler = (Model) => async (req, res) => {
  try {
    const result = await getLikeStatus(Model, req.params.id, req.user.id);
    if (!result) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json(result);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = {
  likePost: likeHandler(Post),
  likeComment: likeHandler(Comment),
  getPostLikeStatus: likeStatusHandler(Post),
  getCommentLikeStatus: likeStatusHandler(Comment),
};