const {
  fetchProblemMetadata,
  fetchRecentSubmissions,
  fetchProfile,
} = require("../../src/adapters/leetcode/leetcode.client");

describe("LeetCode client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("fetches problem metadata", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          question: {
            difficulty: "Medium",
            topicTags: [
              { name: "Array" },
              { name: "Hash Table" },
            ],
          },
        },
      }),
    });

    const result = await fetchProblemMetadata("two-sum");

    expect(result).toEqual({
      difficulty: "Medium",
      tags: ["Array", "Hash Table"],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("fetches recent submissions", async () => {
    const submissions = [
      {
        title: "Two Sum",
        titleSlug: "two-sum",
        timestamp: "1758369342",
        statusDisplay: "Accepted",
        lang: "cpp",
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          recentSubmissionList: submissions,
        },
      }),
    });

    const result = await fetchRecentSubmissions(
      "shreyas1103"
    );

    expect(result).toEqual(submissions);
  });

  test("fetches LeetCode profile", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          matchedUser: {
            username: "shreyas1103",
          },
        },
      }),
    });

    const result = await fetchProfile("shreyas1103");

    expect(result).toEqual({
      username: "shreyas1103",
    });
  });

  test("returns null when LeetCode username does not exist", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          matchedUser: null,
        },
      }),
    });

    const result = await fetchProfile("unknown-user");

    expect(result).toBeNull();
  });

  test("throws when LeetCode API returns an error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      fetchProfile("shreyas1103")
    ).rejects.toThrow(
      "Failed to fetch LeetCode profile for shreyas1103"
    );
  });

  test("throws when LeetCode returns unexpected response shape", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {},
      }),
    });

    await expect(
      fetchProblemMetadata("two-sum")
    ).rejects.toThrow(
      "Unexpected LeetCode response shape for two-sum"
    );
  });
});