const leetcodeClient = require("./leetcode.client");
const leetcodeNormalizer = require("./leetcode.normalizer");
const leetcodeProblemRepository = require("../../repositories/leetcodeProblem.repository");

async function getProblemMetadata(titleSlug) {
  const cached = await leetcodeProblemRepository.findBySlug(titleSlug);
  if (cached) {
    return { difficulty: cached.difficulty, tags: cached.tags };
  }

  const metadata = await leetcodeClient.fetchProblemMetadata(titleSlug);
  await leetcodeProblemRepository.upsert({ titleSlug, ...metadata });

  return metadata;
}

async function fetchActivity(credentials, sinceDate) {
  const { username, userId } = credentials;

  const rawSubmissions = await leetcodeClient.fetchRecentSubmissions(username);

  const relevantSubmissions = sinceDate
    ? rawSubmissions.filter((s) => Number(s.timestamp) * 1000 >= sinceDate.getTime())
    : rawSubmissions;

  const events = [];
  for (const submission of relevantSubmissions) {
    const problemMetadata = await getProblemMetadata(submission.titleSlug);
    events.push(leetcodeNormalizer.normalizeSubmission(submission, problemMetadata, userId));
  }

  return events;
}

async function fetchProfile(credentials) {
  return leetcodeClient.fetchProfile(credentials.username);
}

async function fetchRepos(credentials) {
  return [];
}

module.exports = { getProblemMetadata, fetchActivity, fetchProfile, fetchRepos };