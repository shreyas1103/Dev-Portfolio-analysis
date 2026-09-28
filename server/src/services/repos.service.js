const repoRepository = require("../repositories/repo.repository");

async function getReposForUser(userId, sort, limit) {
  // defense-in-depth only — Zod already guarantees these are valid
  // for any request arriving through the actual route
  const validSort = sort === "recent" ? "recent" : "quality";
  const validLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;

  return repoRepository.findAllByUserSorted(userId, validSort, validLimit);
}

module.exports = { getReposForUser };