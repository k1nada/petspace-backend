const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const Photo = require("../../models/Photo");
const { errorResponse } = require("../../utils/errors");
const { notify } = require("../../utils/notify");
const { withLiked } = require("../../utils/likes");
const {
  validateContentLength,
  assertOwner,
} = require("../../utils/validation");

const MAX_COMMENT_CONTENT_LENGTH = 1000;

const createComment = async (req, res) => {
  const { content, postId, photoId, replyCommentId } = req.body;
  if (!content || (!postId && !photoId))
    return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));
  if (!validateContentLength(content, MAX_COMMENT_CONTENT_LENGTH, res)) return;

  let replyTo = null;
  if (replyCommentId) {
    replyTo = await Comment.findById(replyCommentId).select(
      "user parent post photo",
    );
    if (!replyTo)
      return res.status(404).json(errorResponse("COMMENT_NOT_FOUND"));

    const repliedTarget = postId ? replyTo.post : replyTo.photo;
    if (String(repliedTarget) !== String(postId || photoId))
      return res.status(400).json(errorResponse("INVALID_REQUEST"));
  }

  const comment = await Comment.create({
    content,
    user: req.user.id,
    parent: replyTo ? replyTo.parent || replyTo._id : null,
    ...(postId ? { post: postId } : { photo: photoId }),
  });

  await comment.populate("user", "name avatar username");

  if (replyTo) {
    await notify({
      recipient: replyTo.user,
      user: req.user.id,
      type: "comment",
    });
  } else {
    const target = await (postId ? Post : Photo)
      .findById(postId || photoId)
      .select("user");
    if (target) {
      await notify({
        recipient: target.user,
        user: req.user.id,
        type: "comment",
      });
    }
  }

  res.status(201).json(comment);
};

const getComments = async (req, res) => {
  const { postId, photoId } = req.params;
  const filter = postId ? { post: postId } : { photo: photoId };
  const userId = req.user?.id;

  const comments = await Comment.find(filter)
    .sort({ createdAt: 1 })
    .populate("user", "name avatar username");

  res.json(comments.map((c) => withLiked(c.toObject(), userId)));
};

const updateComment = async (req, res) => {
  const { content } = req.body;
  if (!content)
    return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));
  if (!validateContentLength(content, MAX_COMMENT_CONTENT_LENGTH, res)) return;

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json(errorResponse("COMMENT_NOT_FOUND"));
  if (!assertOwner(comment.user, req.user.id, res)) return;

  comment.content = content;
  await comment.save();
  res.json({ message: "Comment updated" });
};

const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json(errorResponse("COMMENT_NOT_FOUND"));
  if (!assertOwner(comment.user, req.user.id, res)) return;

  await comment.deleteOne();
  await Comment.deleteMany({ parent: comment._id });
  res.json({ message: "Comment deleted" });
};

module.exports = { createComment, getComments, updateComment, deleteComment };
