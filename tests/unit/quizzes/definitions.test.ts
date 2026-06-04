import { describe, it, expect } from "vitest";
import { QUIZZES, ktereSubaru, jakDobreZnas } from "@/lib/quizzes";

describe("quiz registry", () => {
  it("má unikátní slugy", () => {
    const slugs = QUIZZES.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("personální definice", () => {
  const outcomeIds = new Set(ktereSubaru.outcomes.map((o) => o.id));

  it("všechny váhy odkazují na existující OutcomeId", () => {
    for (const q of ktereSubaru.questions) {
      for (const a of q.answers) {
        for (const key of Object.keys(a.weights)) {
          expect(outcomeIds.has(key), `${q.id}/${a.id} -> ${key}`).toBe(true);
        }
      }
    }
  });

  it("každý outcome má neprázdný modelSlug", () => {
    for (const o of ktereSubaru.outcomes) {
      expect(o.modelSlug.length).toBeGreaterThan(0);
    }
  });

  it("má 7 otázek", () => {
    expect(ktereSubaru.questions.length).toBe(7);
  });
});

describe("znalostní definice", () => {
  it("correctId vždy ukazuje na existující odpověď", () => {
    for (const q of jakDobreZnas.questions) {
      const ids = q.answers.map((a) => a.id);
      expect(ids).toContain(q.correctId);
    }
  });

  it("má 10 otázek", () => {
    expect(jakDobreZnas.questions.length).toBe(10);
  });
});
