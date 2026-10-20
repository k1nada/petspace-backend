const User = require("../models/User");
const Message = require("../models/Message");

const socketIdsByUserId = new Map();

const isUserOnline = (userId) => socketIdsByUserId.has(userId.toString());

const addConnection = (userId, socketId) => {
  const socketIds = socketIdsByUserId.get(userId) ?? new Set();
  const wasOffline = socketIds.size === 0;
  socketIds.add(socketId);
  socketIdsByUserId.set(userId, socketIds);
  return wasOffline;
};

const removeConnection = (userId, socketId) => {
  const socketIds = socketIdsByUserId.get(userId);
  if (!socketIds) return false;

  socketIds.delete(socketId);
  if (socketIds.size > 0) return false;

  socketIdsByUserId.delete(userId);
  return true;
};

const getStatusWatcherIds = async (userId) => {
  const user = await User.findById(userId).select("friends");
  const chatParticipantIds = await Message.distinct("participants", {
    participants: userId,
  });

  const watcherIds = new Set();
  for (const friendId of user?.friends ?? []) {
    watcherIds.add(friendId.toString());
  }
  for (const participantId of chatParticipantIds) {
    watcherIds.add(participantId.toString());
  }
  watcherIds.delete(userId);
  return [...watcherIds];
};

module.exports = {
  isUserOnline,
  addConnection,
  removeConnection,
  getStatusWatcherIds,
};
