const mongoose = require("mongoose");

const leetcodeProblemSchema = new mongoose.Schema({
  titleSlug: { type: String, required: true, unique: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  tags: { type: [String], default: [] },
  cachedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LeetCodeProblem", leetcodeProblemSchema);