const {
  exchangeCodeForToken,
  fetchUserProfile,
  fetchRepos,
  fetchCommits,
  checkPathExists,
  fetchContributors,
  fetchReadmeInfo,
} = require("../../src/adapters/github/github.client");

describe("GitHub client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("exchanges OAuth code for access token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        access_token: "github-token-123",
      }),
    });

    const result = await exchangeCodeForToken("auth-code");

    expect(result).toBe("github-token-123");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://github.com/login/oauth/access_token"
    );
  });

  test("fetches GitHub user profile", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        login: "shreyas1103",
      }),
    });

    const result = await fetchUserProfile("token");

    expect(result).toEqual({
      username: "shreyas1103",
    });
  });

  test("fetches repositories", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      json: async () => [
        {
          id: 123,
          name: "portfolio",
        },
      ],
    });

    const result = await fetchRepos("token");

    expect(result).toEqual([
      {
        id: 123,
        name: "portfolio",
      },
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("fetches commits", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      json: async () => [
        {
          sha: "abc123",
        },
      ],
    });

    const result = await fetchCommits(
      "token",
      "shreyas/portfolio"
    );

    expect(result).toEqual([
      {
        sha: "abc123",
      },
    ]);
  });

  test("returns false when requested path does not exist", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    const result = await checkPathExists(
      "token",
      "shreyas/portfolio",
      "README.md"
    );

    expect(result).toBe(false);
  });

  test("returns contributors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          login: "developer1",
        },
      ],
    });

    const result = await fetchContributors(
      "token",
      "shreyas/portfolio"
    );

    expect(result).toEqual([
      {
        login: "developer1",
      },
    ]);
  });

  test("returns README information", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        size: 1250,
      }),
    });

    const result = await fetchReadmeInfo(
      "token",
      "shreyas/portfolio"
    );

    expect(result).toEqual({
      hasReadme: true,
      readmeLength: 1250,
    });
  });

  test("throws when GitHub profile request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      fetchUserProfile("token")
    ).rejects.toThrow("Failed to fetch GitHub profile");
  });

  test("throws when GitHub token exchange fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        error: "bad_verification_code",
      }),
    });

    await expect(
      exchangeCodeForToken("bad-code")
    ).rejects.toThrow("GitHub token exchange failed");
  });
});