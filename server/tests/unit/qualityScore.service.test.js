const {
  calculateRepoQualityScore,
  calculateTopFiveAggregate,
} = require("../../src/services/qualityScore.service");

describe("qualityScore.service", () => {
  describe("calculateRepoQualityScore()", () => {
    test("calculates the maximum quality score", () => {
      const repo = {
        hasReadme: true,
        readmeLength: 3000,
        hasCI: true,
        hasTests: true,
        lastCommitAt: new Date(),
        contributorCount: 5,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.qualityScore).toBe(100);

      expect(result.scoreBreakdown).toEqual({
        readme: 20,
        ci: 25,
        tests: 20,
        recency: 20,
        contributors: 15,
      });
    });

    test("gives zero for missing README, CI, tests, and contributors", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: false,
        lastCommitAt: null,
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.qualityScore).toBe(0);

      expect(result.scoreBreakdown).toEqual({
        readme: 0,
        ci: 0,
        tests: 0,
        recency: 0,
        contributors: 0,
      });
    });
  });

  describe("README scoring", () => {
    test("scores README length bands correctly", () => {
      const createRepo = (readmeLength) => ({
        hasReadme: true,
        readmeLength,
        hasCI: false,
        hasTests: false,
        lastCommitAt: null,
        contributorCount: 1,
      });

      expect(
        calculateRepoQualityScore(createRepo(299))
          .scoreBreakdown.readme
      ).toBe(5);

      expect(
        calculateRepoQualityScore(createRepo(300))
          .scoreBreakdown.readme
      ).toBe(10);

      expect(
        calculateRepoQualityScore(createRepo(1000))
          .scoreBreakdown.readme
      ).toBe(15);

      expect(
        calculateRepoQualityScore(createRepo(3000))
          .scoreBreakdown.readme
      ).toBe(20);
    });

    test("returns zero when README is missing", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 5000,
        hasCI: false,
        hasTests: false,
        lastCommitAt: null,
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.readme).toBe(0);
    });
  });

  describe("CI and test scoring", () => {
    test("CI contributes 25 points when present", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: true,
        hasTests: false,
        lastCommitAt: null,
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.ci).toBe(25);
    });

    test("tests contribute 20 points when present", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: true,
        lastCommitAt: null,
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.tests).toBe(20);
    });
  });

  describe("recency scoring", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(
        new Date("2026-09-26T00:00:00.000Z")
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("returns 20 for a commit today", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: false,
        lastCommitAt: "2026-09-26T00:00:00.000Z",
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.recency).toBe(20);
    });

    test("returns approximately 7 for a commit 60 days ago", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: false,
        lastCommitAt: "2026-07-28T00:00:00.000Z",
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.recency).toBe(7);
    });

    test("returns zero when there is no last commit", () => {
      const repo = {
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: false,
        lastCommitAt: null,
        contributorCount: 1,
      };

      const result = calculateRepoQualityScore(repo);

      expect(result.scoreBreakdown.recency).toBe(0);
    });
  });

  describe("contributor scoring", () => {
    test("scores contributor bands correctly", () => {
      const createRepo = (contributorCount) => ({
        hasReadme: false,
        readmeLength: 0,
        hasCI: false,
        hasTests: false,
        lastCommitAt: null,
        contributorCount,
      });

      expect(
        calculateRepoQualityScore(createRepo(1))
          .scoreBreakdown.contributors
      ).toBe(0);

      expect(
        calculateRepoQualityScore(createRepo(2))
          .scoreBreakdown.contributors
      ).toBe(8);

      expect(
        calculateRepoQualityScore(createRepo(4))
          .scoreBreakdown.contributors
      ).toBe(12);

      expect(
        calculateRepoQualityScore(createRepo(5))
          .scoreBreakdown.contributors
      ).toBe(15);
    });
  });

  describe("calculateTopFiveAggregate()", () => {
    test("returns null average for an empty list", () => {
      expect(calculateTopFiveAggregate([])).toEqual({
        averageScore: null,
        repoCountUsed: 0,
      });
    });

    test("uses only the top five repositories", () => {
      const repos = [
        { qualityScore: 100 },
        { qualityScore: 90 },
        { qualityScore: 80 },
        { qualityScore: 70 },
        { qualityScore: 60 },
        { qualityScore: 10 },
      ];

      const result = calculateTopFiveAggregate(repos);

      expect(result.averageScore).toBe(80);
      expect(result.repoCountUsed).toBe(5);
    });

    test("sorts repositories before selecting the top five", () => {
      const repos = [
        { qualityScore: 20 },
        { qualityScore: 90 },
        { qualityScore: 40 },
        { qualityScore: 80 },
        { qualityScore: 60 },
        { qualityScore: 100 },
      ];

      const result = calculateTopFiveAggregate(repos);

      expect(result.averageScore).toBe(74);
      expect(result.repoCountUsed).toBe(5);
    });

    test("uses all repositories when fewer than five exist", () => {
      const repos = [
        { qualityScore: 80 },
        { qualityScore: 60 },
        { qualityScore: 40 },
      ];

      const result = calculateTopFiveAggregate(repos);

      expect(result.averageScore).toBe(60);
      expect(result.repoCountUsed).toBe(3);
    });
  });
});