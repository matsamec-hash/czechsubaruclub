import { readModelsFile, writeModelsFile } from "@/lib/data/models-file";
import type { Model } from "@/lib/data/models";
import seedData from "./seed-data/subaru-models.json" with { type: "json" };

type SeedEntry = {
  slug: string;
  name: string;
  nameFull: string;
  wikipediaEnTitle: string;
  wikidataQid: string;
  category: string;
  productionStart?: number;
  productionEnd?: number;
};

function main() {
  const entries = seedData as SeedEntry[];
  const existing = readModelsFile();
  const bySlug = new Map(existing.map((m) => [m.slug, m]));
  const now = new Date().toISOString();

  for (const e of entries) {
    const prev = bySlug.get(e.slug);
    const merged: Model = {
      id: prev?.id ?? e.slug,
      slug: e.slug,
      name: e.name,
      nameFull: e.nameFull,
      category: e.category,
      productionStart: e.productionStart ?? null,
      productionEnd: e.productionEnd ?? null,
      wikidataQid: e.wikidataQid,
      // preserve hand-curated / enriched fields:
      taglineCs: prev?.taglineCs ?? null,
      descriptionCs: prev?.descriptionCs ?? null,
      descriptionEnRaw: prev?.descriptionEnRaw ?? null,
      heroImageUrl: prev?.heroImageUrl ?? null,
      contentTier: prev?.contentTier ?? "bronze",
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };
    bySlug.set(e.slug, merged);
    console.log(`[seed-models] ✓ ${e.slug}`);
  }

  writeModelsFile([...bySlug.values()]);
  console.log(`[seed-models] Done. Total: ${bySlug.size} models in data/models.json.`);
}

main();
