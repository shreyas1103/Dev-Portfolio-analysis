const {
  normalizeSubmission,
} = require("../../src/adapters/leetcode/leetcode.normalizer");

describe("LeetCode normalizer", () => {
  const userId = "user123";

  const problemMetadata = {
    tags: ["Array", "Hash Table"],
    difficulty: "Medium",
  };

  test("normalizes an accepted submission correctly", () => {
    const rawSubmission = {
      statusDisplay: "Accepted",
      timestamp: "1758369342",
      titleSlug: "two-sum",
      title: "Two Sum",
      lang: "cpp",
    };

    const result = normalizeSubmission(
      rawSubmission,
      problemMetadata,
      userId
    );

    expect(result).toEqual({
      userId: "user123",
      source: "leetcode",
      type: "submission_accepted",
      date: new Date("2025-09-20T00:00:00Z"),
      topic: "Array",
      difficulty: "Medium",
      externalId: "two-sum-1758369342",
      metadata: {
        titleSlug: "two-sum",
        title: "Two Sum",
        statusDisplay: "Accepted",
        allTags: ["Array", "Hash Table"],
        lang: "cpp",
        rawTimestamp: 1758369342 * 1000,
      },
    });

    expect(result.date.getUTCHours()).toBe(0);
    expect(result.date.getUTCMinutes()).toBe(0);
    expect(result.date.getUTCSeconds()).toBe(0);
  });

  test("normalizes a failed submission correctly", () => {
    const rawSubmission = {
      statusDisplay: "Wrong Answer",
      timestamp: "1758455742",
      titleSlug: "binary-search",
      title: "Binary Search",
      lang: "java",
    };

    const result = normalizeSubmission(
      rawSubmission,
      problemMetadata,
      userId
    );

    expect(result.type).toBe("submission_failed");
    expect(result.topic).toBe("Array");
    expect(result.difficulty).toBe("Medium");
    expect(result.externalId).toBe(
      "binary-search-1758455742"
    );
    expect(result.metadata.statusDisplay).toBe("Wrong Answer");
    expect(result.metadata.lang).toBe("java");
  });

  test("uses null topic when problem has no tags", () => {
    const rawSubmission = {
      statusDisplay: "Accepted",
      timestamp: "1758369342",
      titleSlug: "test-problem",
      title: "Test Problem",
      lang: "cpp",
    };

    const metadata = {
      tags: [],
      difficulty: "Easy",
    };

    const result = normalizeSubmission(
      rawSubmission,
      metadata,
      userId
    );

    expect(result.topic).toBeNull();
    expect(result.difficulty).toBe("Easy");
  });
});