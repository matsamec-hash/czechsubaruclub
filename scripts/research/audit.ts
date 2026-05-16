import "dotenv/config";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== CzechSubaruClub content audit ===\n");

  const tiers = await db
    .select({
      tier: schema.models.contentTier,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.models)
    .groupBy(schema.models.contentTier);

  console.log("Tier distribution:");
  for (const t of tiers) {
    console.log(`  ${t.tier.padEnd(10)} ${t.count}`);
  }

  const totals = await db
    .select({
      total: sql<number>`count(*)::int`,
      withImage: sql<number>`count(hero_image_url)::int`,
      withTagline: sql<number>`count(tagline_cs)::int`,
      withDescription: sql<number>`count(description_cs)::int`,
      withEnRaw: sql<number>`count(description_en_raw)::int`,
    })
    .from(schema.models);

  const t = totals[0];
  console.log("\nCompleteness:");
  console.log(`  Total models           ${t.total}`);
  console.log(
    `  Hero image             ${t.withImage}/${t.total} (${pct(t.withImage, t.total)}%)`,
  );
  console.log(
    `  Tagline CS             ${t.withTagline}/${t.total} (${pct(t.withTagline, t.total)}%)`,
  );
  console.log(
    `  Description CS         ${t.withDescription}/${t.total} (${pct(t.withDescription, t.total)}%)`,
  );
  console.log(
    `  Description EN raw     ${t.withEnRaw}/${t.total} (${pct(t.withEnRaw, t.total)}%)`,
  );

  const missingImage = await db
    .select({ slug: schema.models.slug, qid: schema.models.wikidataQid })
    .from(schema.models)
    .where(sql`hero_image_url IS NULL`);

  if (missingImage.length > 0) {
    console.log(`\nMissing hero_image_url (${missingImage.length}):`);
    for (const m of missingImage) {
      console.log(`  - ${m.slug.padEnd(15)} qid=${m.qid ?? "MISSING"}`);
    }
  }

  const gens = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.generations);
  const trims = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.trims);

  console.log(`\nGenerations: ${gens[0].count}`);
  console.log(`Trims:       ${trims[0].count}`);

  process.exit(0);
}

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

main().catch((err) => {
  console.error("[audit] FAILED:", err);
  process.exit(1);
});
