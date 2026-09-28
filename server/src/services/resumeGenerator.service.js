const activityEventRepository = require("../repositories/activityEvent.repository");
const scoreRepository = require("../repositories/score.repository");
const repoRepository = require("../repositories/repo.repository");
const { InsufficientHistoryError } = require("../errors/AppError");
const MIN_DAYS_REQUIRED = 30;

async function generateResumeBullets(userId) {
  const daysTracked = await activityEventRepository.getDaysTrackedForUser(userId);

  if (daysTracked < MIN_DAYS_REQUIRED) {
   throw new InsufficientHistoryError(daysTracked, MIN_DAYS_REQUIRED);
  }

  const score = await scoreRepository.findByUser(userId);
  const repos = await repoRepository.findAllByUser(userId);

  const bullets = [];

  if (score?.consistencyScore >= 70) {
    bullets.push({
      category: "activity",
      text: `Maintained a consistent coding practice with a ${score.consistencyScore}/100 consistency score and a ${score.longestStreak}-day activity streak.`,
    });
  }

  const topRepo = [...repos].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))[0];
  if (topRepo && topRepo.qualityScore >= 70) {
    bullets.push({
      category: "projects",
      text: `Built and maintained "${topRepo.name}", a well-documented project with automated quality practices (score: ${topRepo.qualityScore}/100).`,
    });
  }

  if (score?.overallQualityScore) {
    bullets.push({
      category: "projects",
      text: `Maintained an average project quality score of ${score.overallQualityScore}/100 across top repositories, reflecting strong documentation and engineering practices.`,
    });
  }

  return bullets;
}

module.exports = { generateResumeBullets };