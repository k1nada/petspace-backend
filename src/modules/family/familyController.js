const User = require("../../models/User");
const FamilyMember = require("../../models/FamilyMember");
const { errorResponse, reportError } = require("../../utils/errors");

const MAX_NAME_LENGTH = 50;
const MAX_BREED_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;

const getFamily = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

    const members = await FamilyMember.find({ owner: user._id }).sort({
      createdAt: 1,
    });

    res.json(members);
  } catch (err) {
    reportError(err, res);
  }
};

const addFamilyMember = async (req, res) => {
  try {
    const { relation, name, avatar, breed, username } = req.body;

    if (!relation || !name)
      return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

    if (!["parent", "child"].includes(relation))
      return res.status(400).json(errorResponse("INVALID_RELATION"));

    if (name.length > MAX_NAME_LENGTH)
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    if (avatar !== undefined && typeof avatar !== "string")
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    if (
      breed !== undefined &&
      (typeof breed !== "string" || breed.length > MAX_BREED_LENGTH)
    )
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

    if (
      username !== undefined &&
      (typeof username !== "string" || username.length > MAX_USERNAME_LENGTH)
    )
      return res.status(400).json(errorResponse("INVALID_REQUEST"));

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
    reportError(err, res);
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
    reportError(err, res);
  }
};

module.exports = { getFamily, addFamilyMember, deleteFamilyMember };
