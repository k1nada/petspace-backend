const Postwall = require("../../models/Postwall");
const { requireUserByUsername } = require("../../utils/findUsers");

const getPostwall = async (req, res) => {
  const user = await requireUserByUsername(req, res);
  if (!user) return;

  const postwall = await Postwall.findOne({ user: user._id });
  res.json(postwall);
};

module.exports = { getPostwall };
