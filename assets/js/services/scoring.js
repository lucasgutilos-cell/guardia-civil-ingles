export const validAnswers = q => q.validAnswers || [q.respuesta_correcta];
export const isCorrect = (q, answer) => !!answer && validAnswers(q).includes(answer);
export function scoreEnglish(questions, answers) {
  let correct = 0,
    wrong = 0,
    blank = 0,
    neutral = 0;
  questions.forEach((q, i) => {
    if (q.neutralized) {
      neutral++;
      return;
    }
    if (!answers[i]) blank++;else if (isCorrect(q, answers[i])) correct++;else wrong++;
  });
  const total = questions.length - neutral,
    penalty = wrong / 3,
    score = correct - penalty;
  return {
    total,
    questionCount: questions.length,
    neutral,
    correct,
    wrong,
    blank,
    penalty,
    score,
    apto: total > 0 && score >= total * .4
  };
}
