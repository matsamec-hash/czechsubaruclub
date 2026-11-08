import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readModelsFile, writeModelsFile } from "@/lib/data/models-file";

// Model photos must not load from upload.wikimedia.org (a third-party server
// would see the visitor's IP before consent). This script downloads each photo
// from the URL currently in `heroImageUrl` (data/models.json), converts it to
// WebP (max 1600 px wide, quality 78, EXIF stripped) into public/fotky/ and
// rewrites `heroImageUrl` to the local path. Author, licence and source link
// stay in heroImageCredit/-License/-Source. Needs ImageMagick (`magick`).
// Run it again after `enrich:models:wikidata` (which writes Commons URLs).

const userAgent = process.env.WIKIPEDIA_USER_AGENT ?? "czechsubaruclub.cz pipeline / info@samecdigital.com";
const OUT_DIR = resolve(process.cwd(), "public/fotky");
const LOCAL_PREFIX = "/fotky/";
const REMOTE_HOST = "upload.wikimedia.org";
const MAX_WIDTH = 1600;
const QUALITY = 78;
const MAX_ATTEMPTS = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const args = process.argv.slice(2);
  return { dryRun: args.includes("--dry-run") };
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": userAgent } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
      const wait = Number(res.headers.get("retry-after")) || 5 * attempt;
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
}

async function main() {
  const { dryRun } = parseArgs();
  const models = readModelsFile();
  const targets = models.filter((m) => m.heroImageUrl?.includes(REMOTE_HOST));
  console.log(`[photos] Start (dryRun=${dryRun}, to download=${targets.length})`);

  if (!dryRun) mkdirSync(OUT_DIR, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "csc-photos-"));
  // Two models may share one photo: downloaded once, the file carries the first slug.
  const done = new Map<string, string>();
  let downloaded = 0,
    errors = 0;

  try {
    for (const m of targets) {
      const url = m.heroImageUrl as string;
      let local = done.get(url);
      if (!local) {
        local = `${LOCAL_PREFIX}${m.slug}.webp`;
        try {
          if (dryRun) {
            console.log(`[photos] ~ ${m.slug}: ${url} -> ${local}`);
          } else {
            const src = join(tmp, m.slug);
            writeFileSync(src, await download(url));
            execFileSync("magick", [
              src,
              "-auto-orient",
              "-resize",
              `${MAX_WIDTH}x>`,
              "-strip",
              "-quality",
              String(QUALITY),
              join(OUT_DIR, `${m.slug}.webp`),
            ]);
            console.log(`[photos] ✓ ${m.slug} -> ${local}`);
            await sleep(1000);
          }
          downloaded++;
        } catch (err) {
          console.error(
            `[photos] ✗ ${m.slug} FAILED: ${err instanceof Error ? err.message : String(err)}`,
          );
          errors++;
          continue;
        }
        done.set(url, local);
      }
      if (!dryRun) {
        m.heroImageUrl = local;
        m.updatedAt = new Date().toISOString();
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  if (!dryRun && targets.length > 0) writeModelsFile(models);
  const missing = models.filter(
    (m) => m.heroImageUrl?.startsWith(LOCAL_PREFIX) && !existsSync(join(OUT_DIR, m.heroImageUrl.slice(LOCAL_PREFIX.length))),
  );
  if (!dryRun && missing.length > 0) {
    console.error(`[photos] Missing file: ${missing.map((m) => m.slug).join(", ")}`);
    errors++;
  }
  console.log(`[photos] Done. downloaded=${downloaded} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[photos] FATAL:", err);
  process.exit(1);
});
