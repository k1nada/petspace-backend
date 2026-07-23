const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const { errorResponse } = require("../utils/errors");

const getFamily = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    const members = await FamilyMember.find({ owner: user._id }).sort({
      createdAt: 1,
    });

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const addFamilyMember = async (req, res) => {
  try {
    const { relation, name, avatar, breed, username } = req.body;

    if (!relation || !name)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

    if (!["parent", "child"].includes(relation))
      return res.status(400).json(errorResponse("INVALID_RELATION"));

    const member = await FamilyMember.create({
      owner: req.user.id,
      relation,
      name,
      avatar,
      breed,
      username,
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

const deleteFamilyMember = async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.memberId);
    if (!member)
      return res.status(404).json(errorResponse("FAMILY_MEMBER_NOT_FOUND"));

    if (member.owner.toString() !== req.user.id)
      return res.status(403).json(errorResponse("ACCESS_DENIED"));

    await member.deleteOne();
    res.json({ message: "Family member removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
  }
};

module.exports = { getFamily, addFamilyMember, deleteFamilyMember };
