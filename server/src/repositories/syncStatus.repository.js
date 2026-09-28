const SyncStatus = require("../models/SyncStatus");

async function markSuccess(userId, source) {
  return SyncStatus.findOneAndUpdate(
    {
      userId,
      source,
    },
    {
      $set: {
        status: "success",
        lastSyncedAt: new Date(),
        lastAttemptAt: new Date(),
        errorMessage: null,
        consecutiveFailures: 0,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}

async function markFailed(userId, source, errorMessage) {
  return SyncStatus.findOneAndUpdate(
    {
      userId,
      source,
    },
    {
      $set: {
        status: "failed",
        lastAttemptAt: new Date(),
        errorMessage,
      },
      $inc: {
        consecutiveFailures: 1,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}
async function findAllByUser(userId) {
  return SyncStatus.find({ userId }).sort({ source: 1 });
}

module.exports = {
  markSuccess,
  markFailed,
  findAllByUser,
};