const mongoose = require("mongoose");

const activityEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  source: {
    type: String,
    required: true,
    enum: ["github", "leetcode", "codeforces", "codechef"],
  },
  type: {
    type: String,
    required: true,
    enum: ["commit", "submission_accepted", "submission_failed", "contest"],
  },
  date: { type: Date, required: true },
  topic: { type: String, default: null },
  difficulty: { type: String, default: null },
  externalId: { type: String, required: true },
  metadata: { type: Object, default: {} },
});

activityEventSchema.index({ userId: 1, date: 1 });
activityEventSchema.index({ userId: 1, externalId: 1 });

module.exports = mongoose.model("ActivityEvent", activityEventSchema);