const Post = require("../models/Post");
const { errorResponse } = require("../utils/errors");

const withLiked = (obj, userId) => ({
  ...obj,
  liked: obj.likes.some((id) => id.toString() === userId),
  likesCount: obj.likes.length,
});

const createPost = async (req, res) => {
  try {
    const { content, postwallId } = req.body;
    if (!content || !postwallId)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

    const post = await Post.create({ content, postwall: postwallId, user: req.user.id });
    await post.populate("user", "name avatar");
    res.status(201).json(post);
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ postwall: req.params.postwallId })
      .populate("user")
      .populate({ path: "comments", populate: { path: "user", select: "name avatar" } })
      .sort({ createdAt: -1 });

    const userId = req.user.id;
    res.json(posts.map((post) => {
      const obj = post.toObject();
      return {
        ...withLiked(obj, userId),
        comments: obj.comments.map((c) => withLiked(c, userId)),
      };
    }));
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));
    if (post.user.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { createPost, getPosts, deletePost };