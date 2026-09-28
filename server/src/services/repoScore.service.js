

function calculateRecencyScore(lastCommitAt, maxWeight = 20) {
  // Empty repository (no commits yet)
  if (!lastCommitAt) {
    return 0;
  }

  const daysSinceLastCommit =
    (Date.now() - new Date(lastCommitAt).getTime()) /
    (1000 * 60 * 60 * 24);

  const DECAY_CONSTANT = 60;

  const score =
    maxWeight * Math.exp(-daysSinceLastCommit / DECAY_CONSTANT);

  return Math.round(score);
}



module.exports = {
  calculateRecencyScore,
};