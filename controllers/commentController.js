const Comment = require("../models/Comment");
const { errorResponse } = require("../utils/errors");

const createComment = async (req, res) => {
  try {
    const { content, postId, photoId } = req.body;
    if (!content || (!postId && !photoId))
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

    const comment = await Comment.create({
      content,
      user: req.user.id,
      ...(postId ? { post: postId } : { photo: photoId }),
    });

    await comment.populate("user", "name avatar");
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const getComments = async (req, res) => {
  try {
    const { postId, photoId } = req.params;
    const filter = postId ? { post: postId } : { photo: photoId };
    const userId = req.user?.id;

    const comments = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .populate("user", "name avatar");

    res.json(
      comments.map((c) => {
        const obj = c.toObject();
        return {
          ...obj,
          liked: userId
            ? obj.likes.some((id) => id.toString() === userId)
            : false,
          likesCount: obj.likes.length,
        };
      }),
    );
  } catch {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment)
      return res.status(404).json(errorResponse("COMMENT_NOT_FOUND"));
    if (comment.user.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (e) {
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { createComment, getComments, deleteComment };
