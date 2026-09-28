const activityEventRepository = require("../repositories/activityEvent.repository");
const stats = require("../utils/stats");

const WINDOW_DAYS = 90;


function buildDailyActivityArray(aggregationResults, windowDays) {
  const activityMap = new Map();

  for (const result of aggregationResults) {
    activityMap.set(result._id.getTime(), result.count);
  }

  const dailyCounts = [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build exactly 'windowDays' entries:
  // oldest day (today - (windowDays - 1)) ... today
  for (let i = windowDays - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - i);

    dailyCounts.push(activityMap.get(day.getTime()) ?? 0);
  }

  return dailyCounts;
}

function buildScoreExplanation(consistencyScore, trend, currentStreak) {
  let band;
  if (consistencyScore >= 71) band = "great";
  else if (consistencyScore >= 41) band = "moderate";
  else band = "needs improvement";

  const trendPhrase =
    trend === "improving" ? "and it's trending upward" :
    trend === "declining" ? "though it's recently declined" :
    "and it's been holding steady";

  return `Your consistency is ${band} ${trendPhrase}. You're currently on a ${currentStreak}-day streak.`;
}

async function computeConsistencyScore(userId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sinceDate = new Date(today);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - (WINDOW_DAYS - 1));

  const aggregationResults =
    await activityEventRepository.getDailyActivityCounts(
      userId,
      sinceDate
    );

  const dailyCounts = buildDailyActivityArray(
    aggregationResults,
    WINDOW_DAYS
  );

  const cov = stats.coefficientOfVariation(dailyCounts);
  const consistencyScore = stats.covToScore(cov);
  const currentStreak = calculateCurrentStreak(dailyCounts);
  const longestStreak = calculateLongestStreak(dailyCounts);
  const trend = calculateTrend(dailyCounts);

  return {
    dailyCounts,
    consistencyScore,
    currentStreak,
    longestStreak,
    trend,
    cov,
  };
}

function calculateCurrentStreak(dailyCounts) {
  let streak = 0;
  for (let i = dailyCounts.length - 1; i >= 0; i--) {
    if (dailyCounts[i] > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(dailyCounts) {
  let currentRun = 0;
  let longestRun = 0;
  for (const count of dailyCounts) {
    if (count > 0) {
      currentRun++;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  }
  return longestRun;
}

function calculateTrend(dailyCounts) {
  const midpoint = Math.floor(dailyCounts.length / 2);

  const oldHalf = dailyCounts.slice(0, midpoint);
  const recentHalf = dailyCounts.slice(midpoint);

  const oldAverage = stats.mean(oldHalf);
  const recentAverage = stats.mean(recentHalf);

  // Edge case: no activity in the older half
  if (oldAverage === 0) {
    if (recentAverage > 0) {
      return "improving";
    }
    return "stable";
  }

  const percentChange = (recentAverage - oldAverage) / oldAverage;

  const THRESHOLD = 0.10;

  if (percentChange > THRESHOLD) {
    return "improving";
  }

  if (percentChange < -THRESHOLD) {
    return "declining";
  }

  return "stable";
}


module.exports = {
  computeConsistencyScore,
  buildDailyActivityArray,
    calculateCurrentStreak,
    calculateLongestStreak,
    calculateTrend,
    buildScoreExplanation,
};