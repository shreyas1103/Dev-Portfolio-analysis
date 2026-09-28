const {
  mean,
  populationStandardDeviation,
  coefficientOfVariation,
  covToScore,
} = require("../../src/utils/stats");

describe("stats utilities", () => {
  describe("mean()", () => {
    test("calculates the mean correctly", () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    test("throws an error for an empty array", () => {
      expect(() => mean([])).toThrow(
        "mean() requires a non-empty array"
      );
    });
  });

  describe("populationStandardDeviation()", () => {
    test("calculates population standard deviation correctly", () => {
      const result = populationStandardDeviation([
        1, 2, 3, 4, 5,
      ]);

      expect(result).toBeCloseTo(Math.sqrt(2), 10);
    });
  });

  describe("coefficientOfVariation()", () => {
    test("calculates coefficient of variation correctly", () => {
      const result = coefficientOfVariation([
        1, 2, 3, 4, 5,
      ]);

      expect(result).toBeCloseTo(Math.sqrt(2) / 3, 10);
    });

    test("returns null when mean is zero", () => {
      expect(
        coefficientOfVariation([-2, -1, 0, 1, 2])
      ).toBeNull();
    });
  });

  describe("covToScore()", () => {
    test("returns 0 when CoV is null", () => {
      expect(covToScore(null)).toBe(0);
    });

    test("returns 100 for zero variation", () => {
      expect(covToScore(0)).toBe(100);
    });

    test("converts CoV to the expected score", () => {
      expect(covToScore(2)).toBe(26);
    });
  });

  describe("consistency scenarios", () => {
    test("steady activity produces a perfect consistency score", () => {
      const steadyActivity = [
        2, 2, 2, 2, 2,
        2, 2, 2, 2, 2,
      ];

      const cov = coefficientOfVariation(steadyActivity);
      const score = covToScore(cov);

      expect(cov).toBe(0);
      expect(score).toBe(100);
    });

    test("bursty activity produces a lower consistency score", () => {
      const burstyActivity = [
        0, 0, 0, 0, 10,
        0, 0, 0, 0, 10,
      ];

      const cov = coefficientOfVariation(burstyActivity);
      const score = covToScore(cov);

      expect(cov).toBe(2);
      expect(score).toBe(26);
    });

    test("steady activity scores higher than bursty activity", () => {
      const steadyActivity = [
        2, 2, 2, 2, 2,
        2, 2, 2, 2, 2,
      ];

      const burstyActivity = [
        0, 0, 0, 0, 10,
        0, 0, 0, 0, 10,
      ];

      const steadyScore = covToScore(
        coefficientOfVariation(steadyActivity)
      );

      const burstyScore = covToScore(
        coefficientOfVariation(burstyActivity)
      );

      expect(steadyScore).toBeGreaterThan(burstyScore);
    });
  });
});