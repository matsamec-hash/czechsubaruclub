import type { PersonalityQuiz, KnowledgeQuiz } from "./types";

/** Vrátí OutcomeId s nejvyšším součtem vah. Tie-break = pořadí v `quiz.outcomes`. */
export function scorePersonality(
  quiz: PersonalityQuiz,
  answers: Record<string, string>,
): string {
  const totals: Record<string, number> = {};
  for (const o of quiz.outcomes) totals[o.id] = 0;

  for (const q of quiz.questions) {
    const ans = q.answers.find((a) => a.id === answers[q.id]);
    if (!ans) continue;
    for (const [outcomeId, weight] of Object.entries(ans.weights)) {
      totals[outcomeId] = (totals[outcomeId] ?? 0) + weight;
    }
  }

  // Strict `>` znamená, že při shodě zůstane dříve iterovaný (vyšší priorita) outcome.
  let bestId = quiz.outcomes[0].id;
  let bestScore = -Infinity;
  for (const o of quiz.outcomes) {
    if (totals[o.id] > bestScore) {
      bestScore = totals[o.id];
      bestId = o.id;
    }
  }
  return bestId;
}

export function scoreKnowledge(
  quiz: KnowledgeQuiz,
  answers: Record<string, string>,
): { score: number; total: number } {
  let score = 0;
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctId) score += 1;
  }
  return { score, total: quiz.questions.length };
}
