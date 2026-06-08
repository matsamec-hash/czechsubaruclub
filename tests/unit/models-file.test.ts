import { describe, it, expect } from "vitest";
import { serializeModels } from "@/lib/data/models-file";
import type { Model } from "@/lib/data/models";

const base: Omit<Model, "slug"> = {
  id: "x", name: "X", nameFull: "X", taglineCs: null, descriptionCs: null,
  descriptionEnRaw: null, category: "suv", productionStart: 2000,
  productionEnd: null, heroImageUrl: null, wikidataQid: null,
  contentTier: "bronze", createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
};
const sample: Model[] = [
  { ...base, slug: "zebra" },
  { ...base, slug: "alpha" },
];

describe("models-file serialize", () => {
  it("sorts by slug and ends with newline", () => {
    const out = serializeModels(sample);
    const parsed = JSON.parse(out) as Model[];
    expect(parsed.map((m) => m.slug)).toEqual(["alpha", "zebra"]);
    expect(out.endsWith("\n")).toBe(true);
  });

  it("uses 2-space indentation (array element keys at 4 spaces)", () => {
    const out = serializeModels(sample);
    expect(out).toContain("\n  {");
    expect(out).toContain('\n    "slug"');
  });
});
