const withReposted = (obj, userId) => ({
  ...obj,
  reposted: !!userId && obj.reposts.some((id) => id.toString() === userId),
  repostsCount: obj.reposts.length,
});

module.exports = { withReposted };
