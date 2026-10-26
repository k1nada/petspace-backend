const Repost = require("../../models/Repost");
const Post = require("../../models/Post");
const Photo = require("../../models/Photo");
const { errorResponse } = require("../../utils/errors");

const toggleRepost = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));

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
};

const toggleRepostPhoto = async (req, res) => {
  const photo = await Photo.findById(req.params.id).select("reposts");
  if (!photo) return res.status(404).json(errorResponse("NOT_FOUND"));

  const added = await Photo.findOneAndUpdate(
    { _id: photo.id, reposts: { $ne: req.user.id } },
    { $addToSet: { reposts: req.user.id } },
    { new: true },
  );
  if (added) return res.json({ reposted: true, count: added.reposts.length });

  const removed = await Photo.findOneAndUpdate(
    { _id: photo.id, reposts: req.user.id },
    { $pull: { reposts: req.user.id } },
    { new: true },
  );
  if (!removed) return res.status(404).json(errorResponse("NOT_FOUND"));
  res.json({ reposted: false, count: removed.reposts.length });
};

module.exports = { toggleRepost, toggleRepostPhoto };
