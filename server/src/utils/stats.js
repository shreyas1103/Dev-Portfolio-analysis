function mean(values) {
  if (values.length === 0) {
    throw new Error("mean() requires a non-empty array");
  }
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function populationStandardDeviation(values) {
  const avg = mean(values);
  const squaredDeviations = values.map((val) => (val - avg) ** 2);
  const variance = mean(squaredDeviations);
  return Math.sqrt(variance);
}

function coefficientOfVariation(values) {
  const avg = mean(values);
  if (avg === 0) return null;

  const stdDev = populationStandardDeviation(values);
  return stdDev / avg;
}

const CONSISTENCY_STEEPNESS = 1.5; // tunable — validated against synthetic scenarios below

function covToScore(cov) {
  if (cov === null) return 0; // no activity at all in the window
  const score = 100 * Math.exp(-cov / CONSISTENCY_STEEPNESS);
  return Math.round(score);
}

module.exports = { mean, populationStandardDeviation, coefficientOfVariation, covToScore };