const {
  normalizeCommit,
  normalizeRepo,
} = require("../../src/adapters/github/github.normalizer");

describe("GitHub normalizer", () => {
  const userId = "user123";

  test("normalizes a commit correctly", () => {
    const rawCommit = {
      sha: "abc123",
      commit: {
        message: "Fix authentication bug",
        author: {
          date: "2026-09-20T14:35:42Z",
        },
      },
    };

    const result = normalizeCommit(
      rawCommit,
      userId,
      "shreyas/project"
    );

    expect(result).toEqual({
      userId: "user123",
      source: "github",
      type: "commit",
      date: new Date("2026-09-20T00:00:00Z"),
      topic: null,
      difficulty: null,
      externalId: "abc123",
      metadata: {
        sha: "abc123",
        message: "Fix authentication bug",
        repo: "shreyas/project",
        rawTimestamp: "2026-09-20T14:35:42Z",
      },
    });
  });

  test("truncates commit date to UTC day", () => {
    const rawCommit = {
      sha: "xyz789",
      commit: {
        message: "Update README",
        author: {
          date: "2026-09-21T23:59:59Z",
        },
      },
    };

    const result = normalizeCommit(
      rawCommit,
      userId,
      "shreyas/project"
    );

    expect(result.date).toEqual(
      new Date("2026-09-21T00:00:00Z")
    );
  });

  test("normalizes a repository correctly", () => {
    const rawRepo = {
      id: 12345,
      name: "portfolio-project",
      pushed_at: "2026-09-22T10:30:00Z",
    };

    const result = normalizeRepo(rawRepo, userId);

    expect(result).toEqual({
      userId: "user123",
      externalRepoId: "12345",
      name: "portfolio-project",
      lastCommitAt: new Date("2026-09-22T10:30:00Z"),
    });
  });
});