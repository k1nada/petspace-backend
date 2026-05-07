const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { errorResponse } = require("../utils/errors");

const toggleLike = async (Model, id, userId) => {
  const doc = await Model.findById(id);
  if (!doc) return null;
  const liked = doc.likes.includes(userId);
  if (liked) {
    doc.likes.pull(userId);
  } else {
    doc.likes.push(userId);
  }
  await doc.save();
  return { liked: !liked, count: doc.likes.length };
};

const likePost = async (req, res) => {
  try {
    const result = await toggleLike(Post, req.params.id, req.user.id);
    if (!result) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const likeComment = async (req, res) => {
  try {
    const result = await toggleLike(Comment, req.params.id, req.user.id);
    if (!result) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getPostLikeStatus = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json({ liked: post.likes.includes(req.user.id), count: post.likes.length });
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getCommentLikeStatus = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json(errorResponse("NOT_FOUND"));
    res.json({ liked: comment.likes.includes(req.user.id), count: comment.likes.length });
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { likePost, likeComment, getPostLikeStatus, getCommentLikeStatus };