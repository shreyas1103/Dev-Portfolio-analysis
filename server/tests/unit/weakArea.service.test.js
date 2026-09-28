const {
  determineConfidence,
  calculatePriority,
  analyzeTopic,
  detectWeakAreas,
} = require("../../src/services/weakArea.service");

describe("weakArea.service", () => {
  describe("determineConfidence()", () => {
    test("returns insufficient_data for fewer than 10 attempts", () => {
      expect(determineConfidence(0)).toBe("insufficient_data");
      expect(determineConfidence(9)).toBe("insufficient_data");
    });

    test("returns low for 10 to 24 attempts", () => {
      expect(determineConfidence(10)).toBe("low");
      expect(determineConfidence(24)).toBe("low");
    });

    test("returns medium for 25 to 49 attempts", () => {
      expect(determineConfidence(25)).toBe("medium");
      expect(determineConfidence(49)).toBe("medium");
    });

    test("returns high for 50 or more attempts", () => {
      expect(determineConfidence(50)).toBe("high");
      expect(determineConfidence(100)).toBe("high");
    });
  });

  describe("calculatePriority()", () => {
    test("returns zero when success rate is 100%", () => {
      expect(calculatePriority(1, 30)).toBe(0);
    });

    test("returns zero when there has been no time since practice", () => {
      expect(calculatePriority(0.5, 0)).toBe(0);
    });

    test("calculates the multiplicative priority formula correctly", () => {
      const successRate = 0.5;
      const daysSinceLastPractice = 90;

      const expected =
        (1 - successRate) *
        (1 - Math.exp(-daysSinceLastPractice / 90));

      expect(
        calculatePriority(
          successRate,
          daysSinceLastPractice
        )
      ).toBeCloseTo(expected, 10);
    });

    test("lower success rate produces higher priority", () => {
      const highSuccessPriority = calculatePriority(0.8, 30);
      const lowSuccessPriority = calculatePriority(0.4, 30);

      expect(lowSuccessPriority).toBeGreaterThan(
        highSuccessPriority
      );
    });

    test("more days since practice produces higher urgency", () => {
      const recentPriority = calculatePriority(0.5, 5);
      const oldPriority = calculatePriority(0.5, 90);

      expect(oldPriority).toBeGreaterThan(recentPriority);
    });
  });

  describe("analyzeTopic()", () => {
    test("returns insufficient-data result when attempts are below 10", () => {
      const result = analyzeTopic({
        topic: "Arrays",
        attemptCount: 9,
        successRate: 0.4,
        daysSinceLastPractice: 20,
        platformAvgSuccessRate: 0.7,
      });

      expect(result.confidence).toBe("insufficient_data");
      expect(result.priority).toBeNull();
      expect(result.topic).toBe("Arrays");
      expect(result.attemptCount).toBe(9);
    });

    test("calculates priority for a topic with sufficient data", () => {
      const result = analyzeTopic({
        topic: "Graphs",
        attemptCount: 30,
        successRate: 0.4,
        daysSinceLastPractice: 30,
        platformAvgSuccessRate: 0.7,
      });

      expect(result.confidence).toBe("medium");
      expect(result.priority).not.toBeNull();
      expect(result.priority).toBeGreaterThan(0);
    });

    test("builds the expected topic information", () => {
      const result = analyzeTopic({
        topic: "DP",
        attemptCount: 50,
        successRate: 0.45,
        daysSinceLastPractice: 10,
        platformAvgSuccessRate: 0.7,
      });

      expect(result.topic).toBe("DP");
      expect(result.successRate).toBe(0.45);
      expect(result.platformAvgSuccessRate).toBe(0.7);
      expect(result.attemptCount).toBe(50);
      expect(result.confidence).toBe("high");
      expect(result.lastPracticedDaysAgo).toBe(10);
    });
  });

  describe("detectWeakAreas()", () => {
    test("filters out topics with insufficient data", () => {
      const topics = [
        {
          topic: "Arrays",
          attemptCount: 9,
          successRate: 0.2,
          daysSinceLastPractice: 30,
          platformAvgSuccessRate: 0.7,
        },
        {
          topic: "Graphs",
          attemptCount: 20,
          successRate: 0.4,
          daysSinceLastPractice: 30,
          platformAvgSuccessRate: 0.7,
        },
      ];

      const result = detectWeakAreas(topics);

      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe("Graphs");
    });

    test("only includes topics below the weakness threshold", () => {
      const topics = [
        {
          topic: "Arrays",
          attemptCount: 20,
          successRate: 0.59,
          daysSinceLastPractice: 30,
          platformAvgSuccessRate: 0.7,
        },
        {
          topic: "Graphs",
          attemptCount: 20,
          successRate: 0.6,
          daysSinceLastPractice: 30,
          platformAvgSuccessRate: 0.7,
        },
      ];

      const result = detectWeakAreas(topics);

      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe("Arrays");
    });

    test("sorts weak areas by priority", () => {
      const topics = [
        {
          topic: "Arrays",
          attemptCount: 20,
          successRate: 0.5,
          daysSinceLastPractice: 10,
          platformAvgSuccessRate: 0.8,
        },
        {
          topic: "Graphs",
          attemptCount: 20,
          successRate: 0.3,
          daysSinceLastPractice: 10,
          platformAvgSuccessRate: 0.8,
        },
      ];

      const result = detectWeakAreas(topics);

      expect(result[0].topic).toBe("Graphs");
      expect(result[0].priority).toBeGreaterThan(
        result[1].priority
      );
    });

    test("limits results to top N", () => {
      const topics = Array.from(
        { length: 7 },
        (_, index) => ({
          topic: `Topic ${index}`,
          attemptCount: 20,
          successRate: 0.2,
          daysSinceLastPractice: 30,
          platformAvgSuccessRate: 0.7,
        })
      );

      const result = detectWeakAreas(topics, 5);

      expect(result).toHaveLength(5);
    });
  });
});