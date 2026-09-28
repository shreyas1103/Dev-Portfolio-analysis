const mongoose = require("mongoose");

const repoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  externalRepoId: { type: String, required: true },
  name: { type: String, required: true },
  language_bytes: { type: Object, default: {} },
  hasReadme: { type: Boolean, default: false },
  readmeLength: { type: Number, default: 0 },
  hasCI: { type: Boolean, default: false },
  hasTests: { type: Boolean, default: false },
  contributorCount: { type: Number, default: 0 },
  lastCommitAt: { type: Date },
  qualityScore: { type: Number, default: null },
  scoreBreakdown: { type: Object, default: null },
  lastSyncedAt: { type: Date, default: Date.now },
});

repoSchema.index({ userId: 1 }, { unique: false });

module.exports = mongoose.model("Repo", repoSchema);