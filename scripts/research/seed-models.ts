import "dotenv/config";
import { db, schema } from "@/lib/db";
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

async function main() {
  const entries = seedData as SeedEntry[];
  console.log(`[seed-models] Inserting ${entries.length} models...`);

  for (const entry of entries) {
    await db
      .insert(schema.models)
      .values({
        slug: entry.slug,
        name: entry.name,
        nameFull: entry.nameFull,
        category: entry.category,
        productionStart: entry.productionStart ?? null,
        productionEnd: entry.productionEnd ?? null,
        wikidataQid: entry.wikidataQid,
        contentTier: "bronze",
      })
      .onConflictDoUpdate({
        target: schema.models.slug,
        set: {
          name: entry.name,
          nameFull: entry.nameFull,
          category: entry.category,
          productionStart: entry.productionStart ?? null,
          productionEnd: entry.productionEnd ?? null,
          wikidataQid: entry.wikidataQid,
          updatedAt: new Date(),
        },
      });

    console.log(`[seed-models] ✓ ${entry.slug}`);
  }

  console.log(`[seed-models] Done. Total: ${entries.length} processed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-models] FAILED:", err);
  process.exit(1);
});
