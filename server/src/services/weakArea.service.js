const CONFIDENCE_THRESHOLDS = {
  insufficientData: 10,
  low: 25,
  medium: 50,
};
const activityEventRepository = require("../repositories/activityEvent.repository");

const MIN_CONTRIBUTING_USERS = 5;

function determineConfidence(attemptCount) {
  if (attemptCount < CONFIDENCE_THRESHOLDS.insufficientData) return "insufficient_data";
  if (attemptCount < CONFIDENCE_THRESHOLDS.low) return "low";
  if (attemptCount < CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "high";
}

const RECENCY_DECAY_CONSTANT = 90; // tunable

function calculateRecencyUrgency(daysSinceLastPractice) {
  return 1 - Math.exp(-daysSinceLastPractice / RECENCY_DECAY_CONSTANT);
}

function calculatePriority(successRate, daysSinceLastPractice) {
  const weakness = 1 - successRate;
  const urgency = calculateRecencyUrgency(daysSinceLastPractice);
  return weakness * urgency;
}

function analyzeTopic(topicStats) {
  const { topic, attemptCount, successRate, daysSinceLastPractice, platformAvgSuccessRate } = topicStats;

  const confidence = determineConfidence(attemptCount);

  if (confidence === "insufficient_data") {
    return {
      topic,
      successRate,
      attemptCount,
      confidence,
      daysSinceLastPractice,
      priority: null,
      reason: `Not enough attempts yet — need at least ${CONFIDENCE_THRESHOLDS.insufficientData} to assess this topic.`,
    };
  }

  const priority = calculatePriority(successRate, daysSinceLastPractice);

  return {
    topic,
    successRate,
    platformAvgSuccessRate,
    attemptCount,
    confidence,
    lastPracticedDaysAgo: daysSinceLastPractice,
    priority,
    reason: buildReasonString(topic, successRate, platformAvgSuccessRate, daysSinceLastPractice, confidence),
  };
}

const WEAKNESS_THRESHOLD = 0.10; // tunable — see LEARNING_NOTES for calibration discussion

function isWeakTopic(successRate, platformAvgSuccessRate) {
  return successRate < (platformAvgSuccessRate - WEAKNESS_THRESHOLD);
}

function detectWeakAreas(allTopicStats, topN = 5) {
  const analyzed = allTopicStats.map((stats) => analyzeTopic(stats));

  const confident = analyzed.filter((entry) => entry.confidence !== "insufficient_data");

  const weak = confident.filter((entry) =>
    isWeakTopic(entry.successRate, entry.platformAvgSuccessRate)
  );

  weak.sort((a, b) => b.priority - a.priority);

  return weak.slice(0, topN);
}
function buildReasonString(topic, successRate, platformAvgSuccessRate, daysSinceLastPractice) {
  const userRate = Math.round(successRate * 100);
  const platformRate = Math.round(platformAvgSuccessRate * 100);
  const dayWord = daysSinceLastPractice === 1 ? "day" : "days";

  return `${topic} has a ${userRate}% success rate, compared with a platform average of ${platformRate}%. You last practiced it ${daysSinceLastPractice} ${dayWord} ago, making it a good candidate for review.`;
}

async function getWeakAreasForUser(userId) {
  const userTopicStats = await activityEventRepository.getUserTopicStats(userId);
  const topics = userTopicStats.map((stat) => stat.topic);

  const benchmarks = await activityEventRepository.getPlatformTopicBenchmarks(topics);
  const benchmarkMap = new Map(benchmarks.map((b) => [b.topic, b]));

  const topicStatsWithBenchmark = [];

  for (const stat of userTopicStats) {
    const benchmark = benchmarkMap.get(stat.topic);

    if (!benchmark || benchmark.contributingUsers < MIN_CONTRIBUTING_USERS) {
      continue;
    }

    topicStatsWithBenchmark.push({
      topic: stat.topic,
      successRate: stat.successRate,
      platformAvgSuccessRate: benchmark.platformAvgSuccessRate,
      attemptCount: stat.attemptCount,
      daysSinceLastPractice: stat.daysSinceLastPractice,
    });
  }

  return detectWeakAreas(topicStatsWithBenchmark);
}
module.exports = { determineConfidence, calculatePriority, analyzeTopic, detectWeakAreas, buildReasonString, getWeakAreasForUser };