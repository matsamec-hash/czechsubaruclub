import "dotenv/config";
import { db, schema } from "@/lib/db";
import { fetchWikidataEntity, extractModelCore } from "@/lib/pipeline/wikidata";
import { eq } from "drizzle-orm";

const userAgent =
  process.env.WIKIPEDIA_USER_AGENT ?? "czechsubaruclub.cz pipeline";

type Args = {
  dryRun: boolean;
  onlySlug: string | null;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    onlySlug:
      args.find((a) => a.startsWith("--only="))?.replace("--only=", "") ??
      null,
  };
}

async function main() {
  const { dryRun, onlySlug } = parseArgs();

  console.log(
    `[wikidata] Start (dryRun=${dryRun}, onlySlug=${onlySlug ?? "ALL"})`,
  );

  const all = await db
    .select({
      slug: schema.models.slug,
      qid: schema.models.wikidataQid,
      currentImage: schema.models.heroImageUrl,
      currentStart: schema.models.productionStart,
    })
    .from(schema.models);

  const targets = onlySlug
    ? all.filter((m) => m.slug === onlySlug)
    : all;

  if (targets.length === 0) {
    console.error(`[wikidata] No models found (filter: ${onlySlug ?? "ALL"})`);
    process.exit(1);
  }

  console.log(`[wikidata] Processing ${targets.length} models`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const m of targets) {
    if (!m.qid) {
      console.warn(`[wikidata] ✗ ${m.slug} has no wikidataQid, skipping`);
      skippedCount++;
      continue;
    }

    try {
      const entity = await fetchWikidataEntity(m.qid, userAgent);
      const core = extractModelCore(entity);

      const changes: string[] = [];
      const updates: Partial<{
        heroImageUrl: string;
        productionStart: number;
      }> = {};

      if (core.imageUrl && core.imageUrl !== m.currentImage) {
        updates.heroImageUrl = core.imageUrl;
        changes.push(`hero_image_url=${core.imageUrl.slice(0, 60)}...`);
      }
      if (
        core.inceptionYear &&
        m.currentStart !== null &&
        core.inceptionYear !== m.currentStart
      ) {
        changes.push(
          `production_start: DB=${m.currentStart}, Wiki=${core.inceptionYear} (NOT overwriting)`,
        );
      }

      if (changes.length === 0) {
        console.log(`[wikidata] = ${m.slug} (no changes)`);
      } else if (dryRun) {
        console.log(
          `[wikidata] ~ ${m.slug} would update: ${changes.join(", ")}`,
        );
        updatedCount++;
      } else {
        await db
          .update(schema.models)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(schema.models.slug, m.slug));
        console.log(`[wikidata] ✓ ${m.slug} updated: ${changes.join(", ")}`);
        updatedCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[wikidata] ✗ ${m.slug} FAILED: ${msg}`);
      errorCount++;
    }
  }

  console.log(
    `[wikidata] Done. updated=${updatedCount} skipped=${skippedCount} errors=${errorCount}`,
  );
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[wikidata] FATAL:", err);
  process.exit(1);
});
