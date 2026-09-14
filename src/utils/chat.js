const isRoomParticipant = (roomId, userId) =>
  roomId.split("_").includes(userId);

module.exports = { isRoomParticipant };
