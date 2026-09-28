const ActivityEvent = require("../models/ActivityEvent");
const mongoose = require("mongoose");
const MIN_CONTRIBUTING_USERS = 5;

async function bulkUpsert(events) {
  if (events.length === 0) return;

  const operations = events.map((event) => ({
    updateOne: {
      filter: {
        userId: event.userId,
        externalId: event.externalId
      },
      update: { $set: event },
      upsert: true,
    },
  }));

  return ActivityEvent.bulkWrite(operations);
}

async function getDailyActivityCounts(userId, sinceDate) {
  return ActivityEvent.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: sinceDate,
        },
      },
    },
    {
      $group: {
        _id: "$date",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

async function getUserTopicStats(userId) {
  const results = await ActivityEvent.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        source: "leetcode",
        topic: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$topic",
        totalAttempts: { $sum: 1 },
        acceptedAttempts: {
          $sum: { $cond: [{ $eq: ["$type", "submission_accepted"] }, 1, 0] },
        },
        lastPracticedDate: { $max: "$date" },
      },
    },
    {
      $project: {
        _id: 0,
        topic: "$_id",
        attemptCount: "$totalAttempts",
        successRate: { $divide: ["$acceptedAttempts", "$totalAttempts"] },
        lastPracticedDate: 1,
      },
    },
  ]);

  return results.map((r) => ({
    ...r,
    daysSinceLastPractice: Math.floor(
      (Date.now() - r.lastPracticedDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

async function getPlatformTopicBenchmarks(topics) {
  return ActivityEvent.aggregate([
    {
      $match: {
        source: "leetcode",
        topic: { $in: topics },
      },
    },
    {
      $group: {
        _id: { userId: "$userId", topic: "$topic" },
        totalAttempts: { $sum: 1 },
        acceptedAttempts: {
          $sum: { $cond: [{ $eq: ["$type", "submission_accepted"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        topic: "$_id.topic",
        successRate: { $divide: ["$acceptedAttempts", "$totalAttempts"] },
      },
    },
    {
      $group: {
        _id: "$topic",
        platformAvgSuccessRate: { $avg: "$successRate" },
        contributingUsers: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        topic: "$_id",
        platformAvgSuccessRate: 1,
        contributingUsers: 1,
      },
    },
  ]);
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

async function getHeatmapEvents(userId, sinceDate) {
  return ActivityEvent.find(
    { userId, date: { $gte: sinceDate } },
    { date: 1, source: 1, "metadata.rawTimestamp": 1, _id: 0 }
  ).lean();
}

async function getDaysTrackedForUser(userId) {
  const earliestEvent = await ActivityEvent.findOne({ userId })
    .sort({ date: 1 })
    .limit(1)
    .lean();

  if (!earliestEvent) {
    return 0; // no activity at all yet
  }

  const daysSince = Math.floor(
    (Date.now() - earliestEvent.date.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSince;
}
module.exports = {
  bulkUpsert,
  getDailyActivityCounts,
  getUserTopicStats,
  getPlatformTopicBenchmarks,
  getWeakAreasForUser,
  getHeatmapEvents,
  getDaysTrackedForUser,
};