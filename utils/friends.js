const containsId = (list, id) => {
  for (const item of list) {
    if (item.toString() === id.toString()) return true;
  }
  return false;
};

const removeId = (list, id) => {
  const result = [];
  for (const item of list) {
    if (item.toString() !== id.toString()) result.push(item);
  }
  return result;
};

const follow = (follower, target) => {
  if (!containsId(follower.following, target._id)) {
    follower.following.push(target._id);
    target.followers.push(follower._id);
  }
};

const unfollow = (follower, target) => {
  follower.following = removeId(follower.following, target._id);
  target.followers = removeId(target.followers, follower._id);
};

module.exports = { containsId, removeId, follow, unfollow };
