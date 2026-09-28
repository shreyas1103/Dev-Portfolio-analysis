const env = require("../../config/env");
const { UpstreamError } = require("../../errors/AppError");


async function exchangeCodeForToken(code) {
  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
      }),
    }
  );

  const data = await response.json();

  if (data.error || !data.access_token) {
     throw new UpstreamError(
      "GitHub token exchange failed"
    );
  }

  return data.access_token;
}

async function fetchUserProfile(accessToken) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json", // GitHub's recommended Accept header for their REST API
    },
  });

  if (!response.ok) {
    throw new UpstreamError("Failed to fetch GitHub profile");
  }

  const data = await response.json();
  return { username: data.login };
}

function parseNextPageUrl(linkHeader) {
  if (!linkHeader) return null;

  const links = linkHeader.split(",");
  for (const link of links) {
    const [urlPart, relPart] = link.split(";");
    if (relPart && relPart.includes('rel="next"')) {
      return urlPart.trim().slice(1, -1); // strip < and >
    }
  }
  return null;
}

async function fetchRepos(accessToken) {
  let repos = [];
  let url = "https://api.github.com/user/repos?per_page=100";

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const remaining = response.headers.get("x-ratelimit-remaining");
    console.log(`GitHub rate limit remaining: ${remaining}`);

    if (!response.ok) {
      throw new UpstreamError("Failed to fetch GitHub repositories");
    }

    const data = await response.json();
    repos = repos.concat(data);

    url = parseNextPageUrl(response.headers.get("link"));
  }

  return repos;
}

async function fetchCommits(accessToken, repoFullName, sinceDate) {
  let commits = [];
  let url = `https://api.github.com/repos/${repoFullName}/commits?per_page=100`;

  if (sinceDate) {
    url += `&since=${sinceDate.toISOString()}`;
  }

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    // TODO: replace with structured logging once Winston is introduced
    const remaining = response.headers.get("x-ratelimit-remaining");
    console.log(`GitHub rate limit remaining: ${remaining}`);
    
    if (response.status === 409) {
    // Repository exists but has no commits yet.
    return [];
}
    if (!response.ok) {
      throw new UpstreamError(`Failed to fetch commits for ${repoFullName}`);
    }

    const data = await response.json();
    commits = commits.concat(data);

    url = parseNextPageUrl(response.headers.get("link"));
  }

  return commits;
}

async function checkPathExists(accessToken, repoFullName, path) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new UpstreamError(`Failed to check path ${path} in ${repoFullName}`);
  }

  return true;
}

async function fetchContributors(accessToken, repoFullName) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contributors`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (response.status === 404 || response.status === 204) {
    return []; // empty repo, or no contributors
  }

  if (!response.ok) {
    throw new UpstreamError(`Failed to fetch contributors for ${repoFullName}`);
  }

  return response.json();
}

async function fetchReadmeInfo(accessToken, repoFullName) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/README.md`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (response.status === 404) {
    return { hasReadme: false, readmeLength: 0 };
  }

  if (!response.ok) {
    throw new UpstreamError(`Failed to fetch README for ${repoFullName}`);
  }

  const data = await response.json();
  return { hasReadme: true, readmeLength: data.size };
}

module.exports = {
  exchangeCodeForToken,
  fetchUserProfile,
  fetchRepos,
  fetchCommits,
  checkPathExists,
  fetchContributors,
  fetchReadmeInfo,
};
