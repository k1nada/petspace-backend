const mongoose = require("mongoose");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Postwall = require("../../models/Postwall");
const Repost = require("../../models/Repost");
const { errorResponse, reportError } = require("../../utils/errors");
const { awardFirstPostAchievement } = require("../../utils/achievements");
const { withLiked } = require("../../utils/likes");

const MAX_POST_CONTENT_LENGTH = 3000;

const serializePosts = async (posts, userId) => {
  const postIds = posts.map((post) => post._id);
  const reposts = await Repost.find({ post: { $in: postIds } }).select(
    "post user",
  );

  return posts.map((post) => {
    const obj = post.toObject();
    const postReposts = reposts.filter(
      (repost) => repost.post.toString() === obj._id.toString(),
    );
    return {
      ...withLiked(obj, userId),
      comments: obj.comments.map((c) => withLiked(c, userId)),
      reposts: postReposts.length,
      reposted: postReposts.some((repost) => repost.user.toString() === userId),
    };
  });
};

const createPost = async (req, res) => {
  try {
    const { content, postwallId, image } = req.body;
    if ((!content && !image) || !postwallId)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));
    if (content && content.length > MAX_POST_CONTENT_LENGTH)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const postwall = await Postwall.findById(postwallId);
    if (!postwall) return res.status(404).json(errorResponse("NOT_FOUND"));

    const isOwnWall = postwall.user.toString() === req.user.id;
    if (!isOwnWall) {
      const currentUser = await User.findById(req.user.id);
      const isFriend = currentUser.friends.some(
        (id) => id.toString() === postwall.user.toString(),
      );
      if (!isFriend)
        return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const post = await Post.create({
      content,
      image,
      postwall: postwallId,
      user: req.user.id,
    });
    await post.populate("user", "name avatar username");
    await awardFirstPostAchievement(req.user.id);

    res.status(201).json(post);
  } catch (err) {
    reportError(err, res);
  }
};

const serializeReposts = async (reposts, userId) => {
  const validReposts = reposts.filter(
    (repost) =>
      repost.post &&
      repost.post.user._id.toString() !== repost.user._id.toString(),
  );

  const repostedPosts = await serializePosts(
    validReposts.map((repost) => repost.post),
    userId,
  );

  for (let i = 0; i < repostedPosts.length; i++) {
    repostedPosts[i].repostedBy = {
      name: validReposts[i].user.name,
      username: validReposts[i].user.username,
    };
    repostedPosts[i].repostedAt = validReposts[i].createdAt;
  }

  return repostedPosts;
};

const sortByWallDate = (posts) => {
  posts.sort(
    (a, b) =>
      new Date(b.repostedAt ?? b.createdAt) -
      new Date(a.repostedAt ?? a.createdAt),
  );
  return posts;
};

const getPosts = async (req, res) => {
  try {
    const postwall = await Postwall.findById(req.params.postwallId);
    if (!postwall) return res.status(404).json(errorResponse("NOT_FOUND"));

    const posts = await Post.find({ postwall: req.params.postwallId })
      .populate("user", "name avatar username")
      .populate({
        path: "comments",
        populate: { path: "user", select: "name avatar username" },
      })
      .sort({ createdAt: -1 });

    const reposts = await Repost.find({ user: postwall.user })
      .populate({
        path: "post",
        populate: [
          { path: "user", select: "name avatar username" },
          {
            path: "comments",
            populate: { path: "user", select: "name avatar username" },
          },
        ],
      })
      .populate("user", "name username")
      .sort({ createdAt: -1 });

    const ownPosts = await serializePosts(posts, req.user.id);
    const repostedPosts = await serializeReposts(reposts, req.user.id);

    res.json(sortByWallDate([...ownPosts, ...repostedPosts]));
  } catch (err) {
    reportError(err, res);
  }
};

const getFeed = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    if (req.user.id !== user._id.toString()) {
      return res.status(403).json(errorResponse("ACCESS_DENIED"));
    }

    const feedUserIds = [
      ...new Set(
        [...user.friends, ...user.following].map((id) => id.toString()),
      ),
    ];

    const postwalls = await Postwall.find({
      user: { $in: feedUserIds },
    }).select("_id");

    const posts = await Post.find({
      postwall: { $in: postwalls.map((postwall) => postwall._id) },
    })
      .populate("user", "name avatar username breed")
      .populate({
        path: "comments",
        populate: { path: "user", select: "name avatar username" },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const reposts = await Repost.find({ user: { $in: feedUserIds } })
      .populate({
        path: "post",
        populate: [
          { path: "user", select: "name avatar username breed" },
          {
            path: "comments",
            populate: { path: "user", select: "name avatar username" },
          },
        ],
      })
      .populate("user", "name username")
      .sort({ createdAt: -1 })
      .limit(50);

    const friendsPosts = await serializePosts(posts, req.user.id);
    const repostedPosts = await serializeReposts(reposts, req.user.id);

    res.json(sortByWallDate([...friendsPosts, ...repostedPosts]));
  } catch (err) {
    reportError(err, res);
  }
};

const updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));
    if (content.length > MAX_POST_CONTENT_LENGTH)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));
    if (post.user.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    post.content = content;
    await post.save();
    res.json({ message: "Post updated" });
  } catch (err) {
    reportError(err, res);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json(errorResponse("POST_NOT_FOUND"));
    if (post.user.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Post.deleteOne({ _id: post._id }).session(session);
      await Repost.deleteMany({ post: post._id }).session(session);
    });
    await session.endSession();

    res.json({ message: "Post deleted" });
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = { createPost, getPosts, getFeed, updatePost, deletePost };
