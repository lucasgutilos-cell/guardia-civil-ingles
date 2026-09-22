export function precision(entry) {
  return entry.total ? 100 * (entry.correct || 0) / entry.total : 0;
}
export function summarize(attempts) {
  const total = attempts.reduce((n, a) => n + (a.total || 0), 0),
    correct = attempts.reduce((n, a) => n + (a.correct || 0), 0);
  return {
    attempts: attempts.length,
    total,
    precision: total ? 100 * correct / total : 0,
    meanScore: attempts.length ? attempts.reduce((n, a) => n + a.score, 0) / attempts.length : 0,
    meanTime: attempts.length ? attempts.reduce((n, a) => n + a.elapsed, 0) / attempts.length : 0
  };
}
