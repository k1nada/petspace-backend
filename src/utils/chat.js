const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;
const MAX_MESSAGE_SEARCH_RESULTS = 20;
const MIN_MESSAGE_SEARCH_LENGTH = 2;

const ROOM_ID_PATTERN = /^[0-9a-f]{24}_[0-9a-f]{24}$/;

const isValidRoomId = (roomId) => {
  if (typeof roomId !== "string" || !ROOM_ID_PATTERN.test(roomId)) {
    return false;
  }
  const [firstId, secondId] = roomId.split("_");
  return firstId < secondId;
};

const isRoomParticipant = (roomId, userId) =>
  isValidRoomId(roomId) && roomId.split("_").includes(userId);

const getPartnerId = (roomId, userId) => {
  const [firstId, secondId] = roomId.split("_");
  return firstId === userId ? secondId : firstId;
};

module.exports = {
  MAX_MESSAGE_LENGTH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_MESSAGE_SEARCH_RESULTS,
  MIN_MESSAGE_SEARCH_LENGTH,
  isValidRoomId,
  isRoomParticipant,
  getPartnerId,
};
