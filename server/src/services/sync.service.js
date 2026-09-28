const connectedAccountRepository = require("../repositories/connectedAccount.repository");
const activityEventRepository = require("../repositories/activityEvent.repository");
const repoRepository = require("../repositories/repo.repository");
const scoreRepository = require("../repositories/score.repository");
const syncStatusRepository = require("../repositories/syncStatus.repository");
const consistencyScoreService = require("./consistencyScore.service");
const qualityScoreService = require("../services/qualityScore.service");
const encryptionUtil = require("../utils/encryption.util");
const adapterFactory = require("../adapters/adapterFactory");

async function syncUserSource(userId, connectedAccount) {
  const adapter = adapterFactory.getAdapter(connectedAccount.source);

  let credentials;

  if (connectedAccount.source === "github") {
    const accessToken = encryptionUtil.decrypt(
      connectedAccount.accessTokenEncrypted
    );

    credentials = {
      accessToken,
      userId,
    };
  } else if (connectedAccount.source === "leetcode") {
    credentials = {
      username: connectedAccount.externalUsername,
      userId,
    };
  } else {
    throw new Error(
      `Unsupported source: ${connectedAccount.source}`
    );
  }

  // adapter.fetchRepos returns normalized data + raw quality signals
  // (hasReadme, readmeLength, hasCI, hasTests, contributorCount).
  // Quality scoring is application-specific, so calculate it here.
  const repos = await adapter.fetchRepos(credentials);

  for (const repoData of repos) {
    const { qualityScore, scoreBreakdown } =
      qualityScoreService.calculateRepoQualityScore(repoData);

    await repoRepository.upsert({
      ...repoData,
      qualityScore,
      scoreBreakdown,
    });
  }

  const events = await adapter.fetchActivity(
    credentials,
    connectedAccount.lastSyncedAt
  );

  await activityEventRepository.bulkUpsert(events);
}
async function syncUser(userId) {
  const accounts = await connectedAccountRepository.findAllByUser(userId);
  for (const account of accounts) {
    try {
      await syncUserSource(userId, account);
      await syncStatusRepository.markSuccess(userId, account.source);
    } catch (err) {
      console.error(
        `Sync failed for user ${userId}, source ${account.source}:`,
        err.message
      );
      await syncStatusRepository.markFailed(
        userId,
        account.source,
        err.message
      );
      // Fault isolation:
      // one failing source must not stop remaining sources.
    }
  }
  // Recompute user-level scores once ALL sources have finished syncing.
  try {
    await recomputeUserScores(userId);
  } catch (err) {
    console.error(
      `Score recomputation failed for user ${userId}:`,
      err.message
    );
    // TODO: record score recomputation failures for monitoring
  }
}
async function recomputeUserScores(userId) {
  const consistencyResult =
    await consistencyScoreService.computeConsistencyScore(userId);
  const repos = await repoRepository.findAllByUser(userId);
  const qualityAggregate =
    qualityScoreService.calculateTopFiveAggregate(repos);
  await scoreRepository.upsert(userId, {
    consistencyScore: consistencyResult.consistencyScore,
    currentStreak: consistencyResult.currentStreak,
    longestStreak: consistencyResult.longestStreak,
    trend: consistencyResult.trend,
     explanation: consistencyResult.explanation,
    overallQualityScore: qualityAggregate.averageScore,
    reposConsidered: qualityAggregate.repoCountUsed,
  });
}
async function syncDueUsers() {
  const userIds =
    await connectedAccountRepository.findAllActiveUserIds();
  for (const userId of userIds) {
    try {
      await syncUser(userId);
    } catch (err) {
      console.error(
        `Sync failed entirely for user ${userId}:`,
        err.message
      );
      // Fault isolation:
      // one user's failure must not stop syncing other users.
    }
  }
}
module.exports = {
  syncUser,
  syncDueUsers,
  recomputeUserScores,

};