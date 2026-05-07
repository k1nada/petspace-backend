const Post = require("../models/Post");
const { errorResponse } = require("../utils/errors");

const createPost = async (req, res) => {
  try {
    const { content, postwallId } = req.body;
    if (!content || !postwallId)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));
    const post = await Post.create({
      content,
      postwall: postwallId,
      user: req.user.id,
    });
    await post.populate("user", "name avatar");
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getPosts = async (req, res) => {
  try {
    const { postwallId } = req.params;
    const posts = await Post.find({ postwall: postwallId })
      .populate("user")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));
    if (post.user.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { createPost, getPosts, deletePost };