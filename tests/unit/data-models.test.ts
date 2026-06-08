import { describe, it, expect } from "vitest";
import { listModels, getModel } from "@/lib/data/models";

describe("data/models", () => {
  it("listModels returns all models sorted by slug (byte order)", () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(0);
    const slugs = all.map((m) => m.slug);
    const sorted = [...slugs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    expect(slugs).toEqual(sorted);
  });

  it("getModel returns the model for a known slug", () => {
    const first = listModels()[0];
    const found = getModel(first.slug);
    expect(found).not.toBeNull();
    expect(found!.slug).toBe(first.slug);
  });

  it("getModel returns null for an unknown slug", () => {
    expect(getModel("___nope___")).toBeNull();
  });

  it("model objects expose the fields consumers read", () => {
    const m = listModels()[0];
    for (const key of [
      "slug", "name", "nameFull", "category",
      "productionStart", "productionEnd", "heroImageUrl",
      "wikidataQid", "taglineCs", "descriptionCs", "descriptionEnRaw",
      "contentTier", "updatedAt",
    ]) {
      expect(m).toHaveProperty(key);
    }
  });
});
