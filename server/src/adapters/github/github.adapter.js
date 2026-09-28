const githubClient = require("./github.client");
const githubNormalizer = require("./github.normalizer");

async function fetchRepos(credentials) {
  const rawRepos = await githubClient.fetchRepos(credentials.accessToken);

  const reposWithSignals = await Promise.all(
    rawRepos.map(async (repo) => {
      const normalized = githubNormalizer.normalizeRepo(repo, credentials.userId);
      const qualitySignals = await fetchRepoQualitySignals(credentials, repo.full_name);
      return { ...normalized, ...qualitySignals };
    })
  );

  return reposWithSignals;
}

async function fetchActivity(credentials, sinceDate) {
  const rawRepos = await githubClient.fetchRepos(credentials.accessToken);
  const events = [];

  for (const repo of rawRepos) {
    const rawCommits = await githubClient.fetchCommits(credentials.accessToken, repo.full_name, sinceDate);
    const normalized = rawCommits.map((commit) =>
      githubNormalizer.normalizeCommit(commit, credentials.userId, repo.full_name)
    );
    events.push(...normalized);
  }

  return events;
}

async function fetchProfile(credentials) {
  return githubClient.fetchUserProfile(credentials.accessToken);
}

const COMMON_TEST_PATHS = ["test", "tests", "__tests__", "spec"];

async function checkHasTests(accessToken, repoFullName) {
  for (const path of COMMON_TEST_PATHS) {
    const exists = await githubClient.checkPathExists(
  accessToken,
  repoFullName,
  path
);
    if (exists) return true;
  }
  return false;
}

async function fetchRepoQualitySignals(credentials, repoFullName) {
  const { accessToken } = credentials;
  const [
  readmeInfo,
  hasCI,
  hasTests,
  contributors,
] = await Promise.all([
  githubClient.fetchReadmeInfo(accessToken, repoFullName),
  githubClient.checkPathExists(accessToken, repoFullName, ".github/workflows"),
  checkHasTests(accessToken, repoFullName),
  githubClient.fetchContributors(accessToken, repoFullName),
]);

return {
  hasReadme: readmeInfo.hasReadme,
  readmeLength: readmeInfo.readmeLength,
  hasCI,
  hasTests,
  contributorCount: contributors.length,
};
}
module.exports = { fetchRepos, fetchActivity, fetchProfile, checkHasTests, fetchRepoQualitySignals };