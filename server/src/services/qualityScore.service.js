const stats = require("../utils/stats"); // not actually needed here, just checking

function scoreReadme(hasReadme, readmeLength) {
  if (!hasReadme) return 0;
  if (readmeLength < 300) return 5;
  if (readmeLength < 1000) return 10;
  if (readmeLength < 3000) return 15;
  return 20;
}

function scoreCI(hasCI) {
  return hasCI ? 25 : 0;
}

function scoreTests(hasTests) {
  return hasTests ? 20 : 0;
}

function scoreRecency(lastCommitAt) {
  if (!lastCommitAt) return 0;
  const daysSinceLastCommit = (Date.now() - new Date(lastCommitAt).getTime()) / (1000 * 60 * 60 * 24);
  const DECAY_CONSTANT = 60;
  return Math.round(20 * Math.exp(-daysSinceLastCommit / DECAY_CONSTANT));
}

function scoreContributors(contributorCount) {
  if (contributorCount <= 1) return 0;
  if (contributorCount <= 2) return 8;
  if (contributorCount <= 4) return 12;
  return 15;
}

function calculateRepoQualityScore(repoData) {
  const breakdown = {
    readme: scoreReadme(repoData.hasReadme, repoData.readmeLength),
    ci: scoreCI(repoData.hasCI),
    tests: scoreTests(repoData.hasTests),
    recency: scoreRecency(repoData.lastCommitAt),
    contributors: scoreContributors(repoData.contributorCount),
  };

  const qualityScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { qualityScore, scoreBreakdown: breakdown };
}

function calculateTopFiveAggregate(repoScores) {
  const sorted = [...repoScores].sort((a, b) => b.qualityScore - a.qualityScore);
  const topFive = sorted.slice(0, 5);

  if (topFive.length === 0) return { averageScore: null, repoCountUsed: 0 };

  const average = topFive.reduce((sum, r) => sum + r.qualityScore, 0) / topFive.length;
  return { averageScore: Math.round(average), repoCountUsed: topFive.length };
}

module.exports = { calculateRepoQualityScore, calculateTopFiveAggregate };