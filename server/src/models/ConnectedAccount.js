const mongoose = require("mongoose");

const connectedAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ["github", "leetcode"],
  },
  externalUsername: {
    type: String,
    required: true,
    trim: true,
  },
  accessTokenEncrypted: {
    type: String,
  required: function () {
    return this.source === "github";
  }
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

connectedAccountSchema.index(
  { userId: 1, source: 1 },
  { unique: true }
);

connectedAccountSchema.index(
  { source: 1, externalUsername: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ConnectedAccount",
  connectedAccountSchema
);