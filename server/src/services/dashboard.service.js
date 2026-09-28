const scoreRepository = require("../repositories/score.repository");
const syncStatusRepository = require("../repositories/syncStatus.repository");
const activityEventRepository = require("../repositories/activityEvent.repository");
async function build(userId) {
  const score = await scoreRepository.findByUser(userId);
  const syncStatuses = await syncStatusRepository.findAllByUser(userId);

  return {
    consistencyScore: score?.consistencyScore ?? 0,
    currentStreak: score?.currentStreak ?? 0,
    longestStreak: score?.longestStreak ?? 0,
    trend: score?.trend ?? "stable",
    explanation: score?.explanation ?? "",
    overallQualityScore: score?.overallQualityScore ?? 0,
    reposConsidered: score?.reposConsidered ?? 0,
    languageBreakdown: score?.languageBreakdown ?? {},
    syncStatuses: syncStatuses.map((s) => ({
      source: s.source,
      status: s.status,
      lastSyncedAt: s.lastSyncedAt,
    })),
    computedAt: score?.computedAt ?? null,
  };
}

async function getHeatmap(userId, days = 90) {
  const clampedDays = Math.min(days, 365);

  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - (clampedDays - 1));
  sinceDate.setUTCHours(0, 0, 0, 0);

  const events = await activityEventRepository.getHeatmapEvents(userId, sinceDate);

  return events.map((e) => ({
    date: e.date,
    rawTimestamp: e.metadata?.rawTimestamp ?? null,
    source: e.source,
  }));
}
module.exports = { build, getHeatmap };