const mongoose = require("mongoose");

const syncStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  source: {
    type: String,
    required: true,
    enum: ["github", "leetcode", "codeforces", "codechef"],
  },

  status: {
    type: String,
    required: true,
    enum: ["pending", "success", "partial", "failed"],
  },

  lastSyncedAt: {
    type: Date,
    default: null,
  },

  lastAttemptAt: {
    type: Date,
    default: null,
  },

  errorMessage: {
    type: String,
    default: null,
  },

  consecutiveFailures: {
    type: Number,
    default: 0,
  },
});

syncStatusSchema.index(
  { userId: 1, source: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SyncStatus",
  syncStatusSchema
);