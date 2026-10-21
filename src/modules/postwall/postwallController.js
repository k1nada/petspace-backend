const Postwall = require("../../models/Postwall");
const { reportError } = require("../../utils/errors");
const { requireUserByUsername } = require("../../utils/findUsers");

const getPostwall = async (req, res) => {
  try {
    const user = await requireUserByUsername(req, res);
    if (!user) return;

    const postwall = await Postwall.findOne({ user: user._id });
    res.json(postwall);
  } catch (err) {
    reportError(err, res);
  }
};

module.exports = { getPostwall };
