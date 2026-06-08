import { readModelsFile, writeModelsFile } from "@/lib/data/models-file";
import { fetchCsEnSummariesByQid } from "@/lib/pipeline/wikipedia";

const userAgent = process.env.WIKIPEDIA_USER_AGENT ?? "czechsubaruclub.cz pipeline";

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    overwrite: args.includes("--overwrite"),
    onlySlug: args.find((a) => a.startsWith("--only="))?.replace("--only=", "") ?? null,
  };
}

async function main() {
  const { dryRun, onlySlug, overwrite } = parseArgs();
  console.log(`[wikipedia] Start (dryRun=${dryRun}, overwrite=${overwrite}, onlySlug=${onlySlug ?? "ALL"})`);

  const models = readModelsFile();
  const targets = onlySlug ? models.filter((m) => m.slug === onlySlug) : models;
  if (targets.length === 0) {
    console.error(`[wikipedia] No models (filter: ${onlySlug ?? "ALL"})`);
    process.exit(1);
  }

  let updated = 0,
    skipped = 0,
    errors = 0,
    changedAny = false;
  for (const m of targets) {
    if (!m.wikidataQid) {
      console.warn(`[wikipedia] ✗ ${m.slug} no qid`);
      skipped++;
      continue;
    }
    try {
      const { cs, en } = await fetchCsEnSummariesByQid(m.wikidataQid, userAgent);
      const changes: string[] = [];
      let touched = false;

      if (cs?.extract && (overwrite || !m.descriptionCs)) {
        changes.push(`description_cs: +${cs.extract.length} chars`);
        if (!dryRun) {
          m.descriptionCs = cs.extract;
          touched = true;
        }
      } else if (cs?.extract && m.descriptionCs && !overwrite) changes.push(`description_cs: exists (skip)`);
      else if (!cs) changes.push(`description_cs: NO CS WIKIPEDIA`);

      if (en?.extract && (overwrite || !m.descriptionEnRaw)) {
        changes.push(`description_en_raw: +${en.extract.length} chars`);
        if (!dryRun) {
          m.descriptionEnRaw = en.extract;
          touched = true;
        }
      } else if (en?.extract && m.descriptionEnRaw && !overwrite) changes.push(`description_en_raw: exists (skip)`);
      else if (!en) changes.push(`description_en_raw: NO EN WIKIPEDIA`);

      if (touched) {
        m.updatedAt = new Date().toISOString();
        changedAny = true;
      }
      if (changes.length > 0 && changes.every((c) => c.includes("exists") || c.includes("NO ")))
        console.log(`[wikipedia] = ${m.slug} (${changes.join("; ")})`);
      else {
        console.log(`[wikipedia] ${dryRun ? "~" : "✓"} ${m.slug}: ${changes.join("; ")}`);
        updated++;
      }
    } catch (err) {
      console.error(
        `[wikipedia] ✗ ${m.slug} FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
      errors++;
    }
  }

  if (!dryRun && changedAny) writeModelsFile(models);
  console.log(`[wikipedia] Done. updated=${updated} skipped=${skipped} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[wikipedia] FATAL:", err);
  process.exit(1);
});
