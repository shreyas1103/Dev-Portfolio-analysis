const { UpstreamError } = require("../../errors/AppError");

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

async function fetchProblemMetadata(titleSlug) {
  const query = `
    query getProblemDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables: { titleSlug } }),
  });

  if (!response.ok) {
    throw new UpstreamError(`Failed to fetch LeetCode problem metadata for ${titleSlug}`);
  }

  const result = await response.json();

  if (!result.data || !result.data.question) {
    throw new UpstreamError(`Unexpected LeetCode response shape for ${titleSlug}`);
  }

  return {
    difficulty: result.data.question.difficulty,
    tags: result.data.question.topicTags.map((tag) => tag.name),
  };
}

async function fetchRecentSubmissions(username) {
  const query = `
    query recentSubmissions($username: String!) {
      recentSubmissionList(username: $username) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new UpstreamError(`Failed to fetch LeetCode submissions for ${username}`);
  }

  const result = await response.json();

  if (!result.data || !result.data.recentSubmissionList) {
    throw new UpstreamError(`Unexpected LeetCode response shape for ${username}`);
  }

  return result.data.recentSubmissionList;
}

async function fetchProfile(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new UpstreamError(`Failed to fetch LeetCode profile for ${username}`);
  }

  const result = await response.json();

  if (!result.data) {
    throw new UpstreamError(`Unexpected LeetCode response shape for ${username}`);
  }

  if (result.data.matchedUser === null) {
    return null; // username genuinely doesn't exist
  }

  if (!result.data.matchedUser.username) {
    throw new UpstreamError(`Unexpected LeetCode profile response for ${username}`);
  }

  return { username: result.data.matchedUser.username };
}

module.exports = { fetchProblemMetadata, fetchRecentSubmissions, fetchProfile };