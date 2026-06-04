import { z } from "zod";

/** Jeden výběr odpovědi. `weights` mapuje OutcomeId → body (jen personální kvíz). */
export const answerSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  icon: z.string().optional(),
  weights: z.record(z.string(), z.number()).default({}),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z.array(answerSchema).min(2),
});

export const outcomeSchema = z.object({
  id: z.string().min(1),
  modelSlug: z.string().min(1),
  archetype: z.string().min(1),
  emoji: z.string().min(1),
  blurb: z.string().min(1),
});

export const knowledgeQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
  correctId: z.string().min(1),
  explanation: z.string().min(1),
});

export const personalityQuizSchema = z.object({
  kind: z.literal("personality"),
  slug: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  outcomes: z.array(outcomeSchema).min(2),
});

export const knowledgeQuizSchema = z.object({
  kind: z.literal("knowledge"),
  slug: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  questions: z.array(knowledgeQuestionSchema).min(1),
});

export const quizSchema = z.discriminatedUnion("kind", [
  personalityQuizSchema,
  knowledgeQuizSchema,
]);

export type Answer = z.infer<typeof answerSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type KnowledgeQuestion = z.infer<typeof knowledgeQuestionSchema>;
export type PersonalityQuiz = z.infer<typeof personalityQuizSchema>;
export type KnowledgeQuiz = z.infer<typeof knowledgeQuizSchema>;
export type Quiz = z.infer<typeof quizSchema>;
