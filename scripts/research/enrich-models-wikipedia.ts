import "dotenv/config";
import { db, schema } from "@/lib/db";
import { fetchCsEnSummariesByQid } from "@/lib/pipeline/wikipedia";
import { eq } from "drizzle-orm";

const userAgent =
  process.env.WIKIPEDIA_USER_AGENT ?? "czechsubaruclub.cz pipeline";

type Args = {
  dryRun: boolean;
  onlySlug: string | null;
  overwrite: boolean;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    overwrite: args.includes("--overwrite"),
    onlySlug:
      args.find((a) => a.startsWith("--only="))?.replace("--only=", "") ??
      null,
  };
}

async function main() {
  const { dryRun, onlySlug, overwrite } = parseArgs();

  console.log(
    `[wikipedia] Start (dryRun=${dryRun}, overwrite=${overwrite}, onlySlug=${onlySlug ?? "ALL"})`,
  );

  const all = await db
    .select({
      slug: schema.models.slug,
      qid: schema.models.wikidataQid,
      descCs: schema.models.descriptionCs,
      descEn: schema.models.descriptionEnRaw,
    })
    .from(schema.models);

  const targets = onlySlug ? all.filter((m) => m.slug === onlySlug) : all;

  if (targets.length === 0) {
    console.error(`[wikipedia] No models found (filter: ${onlySlug ?? "ALL"})`);
    process.exit(1);
  }

  console.log(`[wikipedia] Processing ${targets.length} models`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const m of targets) {
    if (!m.qid) {
      console.warn(`[wikipedia] ✗ ${m.slug} has no wikidataQid, skipping`);
      skippedCount++;
      continue;
    }

    try {
      const { cs, en } = await fetchCsEnSummariesByQid(m.qid, userAgent);

      const updates: Partial<{
        descriptionCs: string;
        descriptionEnRaw: string;
      }> = {};
      const changes: string[] = [];

      if (cs?.extract && (overwrite || !m.descCs)) {
        updates.descriptionCs = cs.extract;
        changes.push(`description_cs: +${cs.extract.length} chars (${cs.url})`);
      } else if (cs?.extract && m.descCs && !overwrite) {
        changes.push(`description_cs: exists (skip, use --overwrite)`);
      } else if (!cs) {
        changes.push(`description_cs: NO CS WIKIPEDIA`);
      }

      if (en?.extract && (overwrite || !m.descEn)) {
        updates.descriptionEnRaw = en.extract;
        changes.push(
          `description_en_raw: +${en.extract.length} chars (${en.url})`,
        );
      } else if (en?.extract && m.descEn && !overwrite) {
        changes.push(`description_en_raw: exists (skip, use --overwrite)`);
      } else if (!en) {
        changes.push(`description_en_raw: NO EN WIKIPEDIA`);
      }

      if (Object.keys(updates).length === 0) {
        console.log(`[wikipedia] = ${m.slug} (${changes.join("; ")})`);
      } else if (dryRun) {
        console.log(`[wikipedia] ~ ${m.slug} would update: ${changes.join("; ")}`);
        updatedCount++;
      } else {
        await db
          .update(schema.models)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(schema.models.slug, m.slug));
        console.log(`[wikipedia] ✓ ${m.slug} updated: ${changes.join("; ")}`);
        updatedCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[wikipedia] ✗ ${m.slug} FAILED: ${msg}`);
      errorCount++;
    }
  }

  console.log(
    `[wikipedia] Done. updated=${updatedCount} skipped=${skippedCount} errors=${errorCount}`,
  );
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[wikipedia] FATAL:", err);
  process.exit(1);
});
