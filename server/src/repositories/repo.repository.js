const Repo = require("../models/Repo");

async function upsert(repoData) {
  return Repo.findOneAndUpdate(
    {
      userId: repoData.userId,
      externalRepoId: repoData.externalRepoId,
    },
    {
      $set: repoData,
    },
    {
      upsert: true,
      new: true,
    }
  );
}
async function findAllByUser(userId) {
  return Repo.find({ userId });
}
async function findAllByUserSorted(userId, sortBy, limit) {
  const sortField = sortBy === "recent" ? { lastCommitAt: -1 } : { qualityScore: -1 };

  return Repo.find({ userId })
    .sort(sortField)
    .limit(limit)
    .lean();
}

module.exports = {
  upsert, findAllByUser,findAllByUserSorted,
};