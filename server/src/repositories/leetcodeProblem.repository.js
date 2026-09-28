const LeetCodeProblem = require("../models/LeetCodeProblem");

async function findBySlug(titleSlug) {
  return LeetCodeProblem.findOne({ titleSlug }).lean();
}

async function upsert(problemData) {
  return LeetCodeProblem.findOneAndUpdate(
    { titleSlug: problemData.titleSlug },
    {
      $set: {
        difficulty: problemData.difficulty,
        tags: problemData.tags,
        cachedAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
    }
  ).lean();
}

module.exports = {
  findBySlug,
  upsert,
};