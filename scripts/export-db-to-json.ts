/**
 * ONE-TIME export of the `subaruclub` schema → data/*.json (source of truth).
 * Uses raw postgres-js (no drizzle) so it does not depend on the ORM we drop.
 * Requires DATABASE_URL in .env.local. After dropping the `postgres` dependency
 * (cleanup task) this script is no longer runnable — kept as a record of the procedure.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[export] DATABASE_URL missing (expected in .env.local)");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 2 });
const DATA_DIR = resolve(process.cwd(), "data");

// camelCase mapping so JSON matches the app's Model type exactly.
function mapModel(r: Record<string, unknown>) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    nameFull: r.name_full,
    taglineCs: r.tagline_cs,
    descriptionCs: r.description_cs,
    descriptionEnRaw: r.description_en_raw,
    category: r.category,
    productionStart: r.production_start,
    productionEnd: r.production_end,
    heroImageUrl: r.hero_image_url,
    wikidataQid: r.wikidata_qid,
    contentTier: r.content_tier,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  };
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  // models — the only table the app reads. Order by slug (C/byte collation).
  const modelRows = await sql`SELECT * FROM subaruclub.models ORDER BY slug`;
  const models = modelRows.map(mapModel);
  writeFileSync(
    resolve(DATA_DIR, "models.json"),
    JSON.stringify(models, null, 2) + "\n",
  );
  console.log(`[export] models.json  rows=${models.length}`);

  // archival dumps of unused tables (raw snake_case) — only if non-empty.
  for (const table of ["generations", "trims", "media", "cz_context"]) {
    const rows = await sql`SELECT * FROM subaruclub.${sql(table)}`;
    if (rows.length > 0) {
      const file = table.replace(/_/g, "-") + ".json";
      writeFileSync(
        resolve(DATA_DIR, file),
        JSON.stringify(rows, null, 2) + "\n",
      );
    }
    console.log(`[export] ${table.padEnd(12)} rows=${rows.length}`);
  }

  await sql.end();
  console.log("[export] DONE");
  process.exit(0);
}

main().catch((err) => {
  console.error("[export] FAILED:", err);
  process.exit(1);
});
