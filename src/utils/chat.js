const isRoomParticipant = (roomId, userId) =>
  typeof roomId === "string" && roomId.split("_").includes(userId);

module.exports = { isRoomParticipant };
