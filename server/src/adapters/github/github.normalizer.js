function truncateToDay(dateString) {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function normalizeCommit(rawCommit, userId, repoFullName) {
  return {
    userId,
    source: "github",
    type: "commit",
    date: truncateToDay(rawCommit.commit.author.date),
    topic: null,
    difficulty: null,
    externalId: rawCommit.sha,
    metadata: {
      sha: rawCommit.sha,
      message: rawCommit.commit.message,
      repo: repoFullName,
      rawTimestamp: rawCommit.commit.author.date,
    },
  };
}

function normalizeRepo(rawRepo, userId) {
  return {
    userId,
    externalRepoId: String(rawRepo.id),
    name: rawRepo.name,
    lastCommitAt: new Date(rawRepo.pushed_at),
  };
}

module.exports = { normalizeCommit, normalizeRepo };