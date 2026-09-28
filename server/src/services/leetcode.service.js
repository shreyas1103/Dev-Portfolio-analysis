const connectedAccountRepository = require("../repositories/connectedAccount.repository");
const leetcodeAdapter = require("../adapters/leetcode/leetcode.adapter");
const { ConflictError, NotFoundError } = require("../errors/AppError");

async function connectAccount(userId, username) {
  const existing = await connectedAccountRepository.findByUserAndSource(userId, "leetcode");
  if (existing) {
    throw new ConflictError("LeetCode account is already connected");
  }

  const profile = await leetcodeAdapter.fetchProfile({ username, userId });
  if (!profile) {
    throw new NotFoundError("LeetCode username not found");
  }

  return connectedAccountRepository.create({
    userId,
    source: "leetcode",
    externalUsername: username,
    isActive: true,
    connectedAt: new Date(),
  });
}

module.exports = { connectAccount };