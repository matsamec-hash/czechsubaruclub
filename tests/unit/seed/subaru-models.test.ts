import { describe, it, expect } from "vitest";
import seedData from "@/scripts/research/seed-data/subaru-models.json";

const HERO_MODELS = [
  "impreza",
  "wrx",
  "wrx-sti",
  "forester",
  "outback",
  "legacy",
  "brz",
  "levorg",
  "xv",
  "svx",
  "justy",
  "tribeca",
];

const VALID_CATEGORIES = [
  "sedan",
  "hatchback",
  "suv",
  "wagon",
  "coupe",
  "jdm",
  "kei",
  "minivan",
  "pickup",
];

describe("subaru-models.json seed data", () => {
  it("obsahuje array záznamů", () => {
    expect(Array.isArray(seedData)).toBe(true);
    expect(seedData.length).toBeGreaterThanOrEqual(27);
    expect(seedData.length).toBeLessThanOrEqual(35);
  });

  it("každý záznam má povinné fieldy", () => {
    for (const entry of seedData) {
      expect(entry).toHaveProperty("slug");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("nameFull");
      expect(entry).toHaveProperty("wikipediaEnTitle");
      expect(entry).toHaveProperty("wikidataQid");
      expect(entry).toHaveProperty("category");
    }
  });

  it("slugy jsou unique a kebab-case", () => {
    const slugs = seedData.map((e) => e.slug);
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const slug of slugs) {
      expect(slug).toMatch(slugRegex);
    }
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("kategorie jsou jen z povolené sady", () => {
    for (const entry of seedData) {
      expect(VALID_CATEGORIES).toContain(entry.category);
    }
  });

  it("Wikidata QIDs jsou ve formátu Q<číslo>", () => {
    for (const entry of seedData) {
      expect(entry.wikidataQid).toMatch(/^Q\d+$/);
    }
  });

  it("obsahuje všech 12 hero modelů", () => {
    const slugs = seedData.map((e) => e.slug);
    for (const heroSlug of HERO_MODELS) {
      expect(slugs).toContain(heroSlug);
    }
  });
});
