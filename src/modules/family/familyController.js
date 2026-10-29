const FamilyMember = require("../../models/FamilyMember");
const { errorResponse } = require("../../utils/errors");
const { assertOwner } = require("../../utils/validation");
const { requireUserByUsername } = require("../../utils/findUsers");
const { isOwnCloudinaryUrl } = require("../../utils/cloudinary");

const MAX_NAME_LENGTH = 50;
const MAX_BREED_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;
const MAX_AVATAR_URL_LENGTH = 500;
const MAX_PARENTS = 2;
const MAX_PUPPIES = 50;

const getFamily = async (req, res) => {
  const user = await requireUserByUsername(req, res);
  if (!user) return;

  const members = await FamilyMember.find({ owner: user._id }).sort({
    createdAt: 1,
  });

  res.json(members);
};

const addFamilyMember = async (req, res) => {
  const { relation, name, avatar, breed, username } = req.body;

  if (!relation || !name)
    return res.status(400).json(errorResponse("MISSING_REQUIRED_FIELDS"));

  if (!["parent", "child"].includes(relation))
    return res.status(400).json(errorResponse("INVALID_RELATION"));

  if (typeof name !== "string" || name.length > MAX_NAME_LENGTH)
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  if (
    avatar !== undefined &&
    avatar !== null &&
    (!isOwnCloudinaryUrl(avatar) || avatar.length > MAX_AVATAR_URL_LENGTH)
  )
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  if (
    breed !== undefined &&
    breed !== null &&
    (typeof breed !== "string" || breed.length > MAX_BREED_LENGTH)
  )
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  if (
    username !== undefined &&
    (typeof username !== "string" || username.length > MAX_USERNAME_LENGTH)
  )
    return res.status(400).json(errorResponse("INVALID_REQUEST"));

  if (relation === "parent") {
    const parentCount = await FamilyMember.countDocuments({
      owner: req.user.id,
      relation: "parent",
    });
    if (parentCount >= MAX_PARENTS)
      return res.status(400).json(errorResponse("PARENT_LIMIT_REACHED"));
  }

  if (relation === "child") {
    const puppyCount = await FamilyMember.countDocuments({
      owner: req.user.id,
      relation: "child",
    });
    if (puppyCount >= MAX_PUPPIES)
      return res.status(400).json(errorResponse("PUPPIES_LIMIT_REACHED"));
  }

  const member = await FamilyMember.create({
    owner: req.user.id,
    relation,
    name,
    avatar,
    breed,
    username,
  });

  res.status(201).json(member);
};

const deleteFamilyMember = async (req, res) => {
  const member = await FamilyMember.findById(req.params.memberId);
  if (!member)
    return res.status(404).json(errorResponse("FAMILY_MEMBER_NOT_FOUND"));

  if (!assertOwner(member.owner, req.user.id, res)) return;

  await member.deleteOne();
  res.json({ message: "Family member removed" });
};

module.exports = { getFamily, addFamilyMember, deleteFamilyMember };
