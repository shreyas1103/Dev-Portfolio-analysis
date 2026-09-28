const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    consistencyScore: {
      type: Number,
      default: 0,
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    trend: {
      type: String,
      enum: ["improving", "stable", "declining"],
      default: "stable",
    },

    overallQualityScore: {
      type: Number,
      default: 0,
    },

    reposConsidered: {
      type: Number,
      default: 0,
    },

    weakAreas: {
      type: Array,
      default: [],
    },

    languageBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },

    computedAt: {
      type: Date,
      default: Date.now,
    },
    explanation: { type: String, default: "" },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Score", scoreSchema);