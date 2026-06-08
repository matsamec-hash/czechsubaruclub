import { readModelsFile, writeModelsFile } from "@/lib/data/models-file";
import { fetchWikidataEntity, extractModelCore } from "@/lib/pipeline/wikidata";

const userAgent = process.env.WIKIPEDIA_USER_AGENT ?? "czechsubaruclub.cz pipeline";

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    onlySlug: args.find((a) => a.startsWith("--only="))?.replace("--only=", "") ?? null,
  };
}

async function main() {
  const { dryRun, onlySlug } = parseArgs();
  console.log(`[wikidata] Start (dryRun=${dryRun}, onlySlug=${onlySlug ?? "ALL"})`);

  const models = readModelsFile();
  const targets = onlySlug ? models.filter((m) => m.slug === onlySlug) : models;
  if (targets.length === 0) {
    console.error(`[wikidata] No models (filter: ${onlySlug ?? "ALL"})`);
    process.exit(1);
  }

  let updated = 0,
    skipped = 0,
    errors = 0,
    changedAny = false;
  for (const m of targets) {
    if (!m.wikidataQid) {
      console.warn(`[wikidata] ✗ ${m.slug} no qid`);
      skipped++;
      continue;
    }
    try {
      const core = extractModelCore(await fetchWikidataEntity(m.wikidataQid, userAgent));
      const changes: string[] = [];
      if (core.imageUrl && core.imageUrl !== m.heroImageUrl) {
        changes.push(`hero_image_url=${core.imageUrl.slice(0, 60)}...`);
        if (!dryRun) {
          m.heroImageUrl = core.imageUrl;
          m.updatedAt = new Date().toISOString();
          changedAny = true;
        }
      }
      if (
        core.inceptionYear &&
        m.productionStart !== null &&
        core.inceptionYear !== m.productionStart
      ) {
        changes.push(
          `production_start: JSON=${m.productionStart}, Wiki=${core.inceptionYear} (NOT overwriting)`,
        );
      }
      if (changes.length === 0) console.log(`[wikidata] = ${m.slug}`);
      else {
        console.log(`[wikidata] ${dryRun ? "~" : "✓"} ${m.slug}: ${changes.join(", ")}`);
        updated++;
      }
    } catch (err) {
      console.error(
        `[wikidata] ✗ ${m.slug} FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
      errors++;
    }
  }

  if (!dryRun && changedAny) writeModelsFile(models);
  console.log(`[wikidata] Done. updated=${updated} skipped=${skipped} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[wikidata] FATAL:", err);
  process.exit(1);
});
