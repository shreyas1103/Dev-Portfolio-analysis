function truncateToDay(dateString) {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
function normalizeSubmission(rawSubmission, problemMetadata, userId) {
  const isAccepted = rawSubmission.statusDisplay === "Accepted";
  const timestampMs = Number(rawSubmission.timestamp) * 1000;

  return {
    userId,
    source: "leetcode",
    type: isAccepted ? "submission_accepted" : "submission_failed",
    date: truncateToDay(timestampMs),
    topic: problemMetadata.tags[0] ?? null,
    difficulty: problemMetadata.difficulty,
    externalId: `${rawSubmission.titleSlug}-${rawSubmission.timestamp}`,
    metadata: {
      titleSlug: rawSubmission.titleSlug,
      title: rawSubmission.title,
      statusDisplay: rawSubmission.statusDisplay,
      allTags: problemMetadata.tags,
      lang: rawSubmission.lang,
      rawTimestamp: Number(rawSubmission.timestamp) * 1000,
    },
  };
}

module.exports = { normalizeSubmission };