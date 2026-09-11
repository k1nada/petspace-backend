const Repost = require("../../models/Repost");
const Post = require("../../models/Post");
const { errorResponse, reportError } = require("../../utils/errors");

const toggleRepost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));
    if (post.user.toString() === req.user.id)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    let reposted;
    try {
      await Repost.create({ post: post._id, user: req.user.id });
      reposted = true;
    } catch (err) {
      if (err.code !== 11000) throw err;
      await Repost.deleteOne({ post: post._id, user: req.user.id });
      reposted = false;
    }

    const count = await Repost.countDocuments({ post: post._id });
    res.json({ reposted, count });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = { toggleRepost };
