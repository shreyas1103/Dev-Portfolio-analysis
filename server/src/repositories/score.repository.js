const Score = require("../models/Score");

async function upsert(userId, scoreData) {
  return Score.findOneAndUpdate(
    { userId },
    { $set: { ...scoreData, computedAt: new Date() } },
    { upsert: true, new: true }
  );
}
async function findByUser(userId) {
  return Score.findOne({ userId }).lean();
}
async function findAllByUser(userId) {
  return SyncStatus.find({ userId }).lean();
}

module.exports = { upsert, findByUser, findAllByUser };