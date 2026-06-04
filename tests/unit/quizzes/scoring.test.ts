import { describe, it, expect } from "vitest";
import { scorePersonality, scoreKnowledge } from "@/lib/quizzes/scoring";
import type { PersonalityQuiz, KnowledgeQuiz } from "@/lib/quizzes/types";

const personality: PersonalityQuiz = {
  kind: "personality",
  slug: "p",
  title: "P",
  intro: "i",
  outcomes: [
    { id: "alpha", modelSlug: "a", archetype: "A", emoji: "🅰️", blurb: "b" },
    { id: "beta", modelSlug: "b", archetype: "B", emoji: "🅱️", blurb: "b" },
  ],
  questions: [
    {
      id: "q1",
      text: "q1",
      answers: [
        { id: "q1a", text: "a", weights: { alpha: 3 } },
        { id: "q1b", text: "b", weights: { beta: 1 } },
      ],
    },
    {
      id: "q2",
      text: "q2",
      answers: [
        { id: "q2a", text: "a", weights: { beta: 2 } },
        { id: "q2b", text: "b", weights: { alpha: 1 } },
      ],
    },
  ],
};

const knowledge: KnowledgeQuiz = {
  kind: "knowledge",
  slug: "k",
  title: "K",
  intro: "i",
  questions: [
    { id: "k1", text: "k1", correctId: "k1b", explanation: "e", answers: [
      { id: "k1a", text: "a" }, { id: "k1b", text: "b" } ] },
    { id: "k2", text: "k2", correctId: "k2a", explanation: "e", answers: [
      { id: "k2a", text: "a" }, { id: "k2b", text: "b" } ] },
  ],
};

describe("scorePersonality", () => {
  it("picks the outcome with the highest total weight", () => {
    expect(scorePersonality(personality, { q1: "q1a", q2: "q2a" })).toBe("alpha");
  });

  it("ignores missing/unknown answers", () => {
    expect(scorePersonality(personality, { q2: "q2b" })).toBe("alpha");
  });

  it("breaks ties by outcome order (first outcome wins)", () => {
    expect(scorePersonality(personality, { q1: "q1b", q2: "q2b" })).toBe("alpha");
  });
});

describe("scoreKnowledge", () => {
  it("counts correct answers", () => {
    expect(scoreKnowledge(knowledge, { k1: "k1b", k2: "k2a" })).toEqual({ score: 2, total: 2 });
  });

  it("counts wrong/missing as incorrect", () => {
    expect(scoreKnowledge(knowledge, { k1: "k1a" })).toEqual({ score: 0, total: 2 });
  });
});
