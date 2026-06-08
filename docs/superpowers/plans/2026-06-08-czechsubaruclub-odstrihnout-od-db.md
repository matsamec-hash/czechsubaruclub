# czechsubaruclub — odstřižení od sdílené DB — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** czechsubaruclub buildí a deployuje bez jakékoli DB — data `subaruclub.models` jsou vypečená do `data/models.json` v repu a čtená při buildu.

**Architecture:** Jednorázový export živé tabulky `subaruclub.models` → `data/models.json` (source of truth). Tenká čtecí vrstva `lib/data/models.ts` (`listModels`/`getModel`) nahradí inline drizzle dotazy v 7 konzumentech. Enrichment skripty přepsané na JSON in/out. Pak drop `lib/db/`, drizzle/postgres deps a DB env vars.

**Tech Stack:** Next.js 16 (App Router, `output: export`), TypeScript, Vitest, tsx, postgres-js (jen pro jednorázový export).

**Pracovní adresář:** worktree `~/czechsubaruclub-db-decouple` (branch `feat/odstrihnout-od-db`).

**Konvence:** commit messages anglicky; NIKDY `git add -A` (přidávat explicitní cesty); `.env.local` nikdy necommitovat.

---

## Build-parity definice (akceptační kritérium pro celý plán)

`sitemap.ts` používá `new Date()` pro statické a kvízové routy → `<lastmod>` se mění každý build. Proto:

> **Parity = `diff -r /tmp/out-baseline out` ukazuje rozdíly POUZE v `<lastmod>` hodnotách v `out/sitemap.xml` (statické + kvízové routy). Všechny ostatní soubory — stránky modelů, `modely/index`, `llms.txt`, OG PNG, `index.html` — jsou bajt-identické. Řádky modelů v sitemapě (`/modely/<slug>`) mají `<lastmod>` z dat → taky identické.**

---

## Task 1: Jednorázový export živé DB → `data/*.json`

**Files:**
- Create: `scripts/export-db-to-json.ts`
- Create (výstup): `data/models.json` (+ `data/generations.json`, `data/trims.json`, `data/media.json`, `data/cz-context.json` pokud mají řádky)

- [ ] **Step 1: Napsat export skript**

`scripts/export-db-to-json.ts`:

```ts
/**
 * ONE-TIME export of the `subaruclub` schema → data/*.json (source of truth).
 * Uses raw postgres-js (no drizzle) so it does not depend on the ORM we drop.
 * Requires DATABASE_URL in .env.local. After dropping the `postgres` dependency
 * (Task 7) this script is no longer runnable — kept as a record of the procedure.
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
```

- [ ] **Step 2: Spustit export**

Run: `cd ~/czechsubaruclub-db-decouple && npx tsx scripts/export-db-to-json.ts`
Expected: vypíše `models.json rows=N` (N = počet modelů, ~27) a počty ostatních tabulek. `data/models.json` existuje.

- [ ] **Step 3: Sanity-check výstupu**

Run: `node -e "const m=require('./data/models.json'); console.log('count', m.length); console.log('keys', Object.keys(m[0]).join(',')); console.log('sample', m[0].slug, m[0].category)"`
Expected: count odpovídá N z exportu; keys obsahují `slug,name,nameFull,taglineCs,descriptionCs,descriptionEnRaw,category,productionStart,productionEnd,heroImageUrl,wikidataQid,contentTier,createdAt,updatedAt`.

- [ ] **Step 4: Commit**

```bash
git add scripts/export-db-to-json.ts data/models.json
# přidat i archivní dumpy, pokud vznikly:
git add data/generations.json data/trims.json data/media.json data/cz-context.json 2>/dev/null || true
git commit -m "feat(data): export subaruclub schema to data/*.json (source of truth)"
```

---

## Task 2: Baseline build z DB → snapshot `/tmp/out-baseline`

Tohle zachytí referenční výstup PŘED jakoukoli změnou kódu (build ještě jede proti DB). Slouží jako etalon pro build-parity.

**Files:** žádné (jen build + kopie)

- [ ] **Step 1: Čistý build proti DB**

Run: `cd ~/czechsubaruclub-db-decouple && rm -rf out .next && npm run build`
Expected: build projde, `out/` se vygeneruje (modely, kvíz, sitemap.xml, llms.txt).

- [ ] **Step 2: Snapshot baseline**

Run: `rm -rf /tmp/out-baseline && cp -R out /tmp/out-baseline && ls /tmp/out-baseline/modely | head`
Expected: `/tmp/out-baseline` obsahuje vyrenderované stránky modelů.

- [ ] **Step 3: Žádný commit** (out/ je v .gitignore). Pokračovat.

---

## Task 3: Čtecí vrstva `lib/data/models.ts` (TDD)

**Files:**
- Create: `lib/data/models.ts`
- Test: `tests/unit/data-models.test.ts`
- Verify: `tsconfig.json` má `resolveJsonModule: true`

- [ ] **Step 1: Ověřit resolveJsonModule**

Run: `node -e "const t=require('./tsconfig.json'); console.log(t.compilerOptions.resolveJsonModule)"`
Pokud není `true`: přidat `"resolveJsonModule": true` do `compilerOptions` v `tsconfig.json` (Next 16 default ho má, ale ověřit).

- [ ] **Step 2: Napsat failing test**

`tests/unit/data-models.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { listModels, getModel } from "@/lib/data/models";

describe("data/models", () => {
  it("listModels returns all models sorted by slug (byte order)", () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(0);
    const slugs = all.map((m) => m.slug);
    const sorted = [...slugs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    expect(slugs).toEqual(sorted);
  });

  it("getModel returns the model for a known slug", () => {
    const first = listModels()[0];
    const found = getModel(first.slug);
    expect(found).not.toBeNull();
    expect(found!.slug).toBe(first.slug);
  });

  it("getModel returns null for an unknown slug", () => {
    expect(getModel("___nope___")).toBeNull();
  });

  it("model objects expose the fields consumers read", () => {
    const m = listModels()[0];
    for (const key of [
      "slug", "name", "nameFull", "category",
      "productionStart", "productionEnd", "heroImageUrl",
      "wikidataQid", "taglineCs", "descriptionCs", "descriptionEnRaw",
      "contentTier", "updatedAt",
    ]) {
      expect(m).toHaveProperty(key);
    }
  });
});
```

- [ ] **Step 3: Spustit test — musí selhat**

Run: `npx vitest run tests/unit/data-models.test.ts`
Expected: FAIL (`Cannot find module '@/lib/data/models'`).

- [ ] **Step 4: Napsat čtecí vrstvu**

`lib/data/models.ts`:

```ts
import modelsJson from "@/data/models.json";

export type Model = {
  id: string;
  slug: string;
  name: string;
  nameFull: string;
  taglineCs: string | null;
  descriptionCs: string | null;
  descriptionEnRaw: string | null;
  category: string;
  productionStart: number | null;
  productionEnd: number | null;
  heroImageUrl: string | null;
  wikidataQid: string | null;
  contentTier: string;
  createdAt: string;
  updatedAt: string;
};

const models = modelsJson as Model[];

/** All models sorted by slug using byte/code-point order (mirrors Postgres ORDER BY text). */
export function listModels(): Model[] {
  return [...models].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

export function getModel(slug: string): Model | null {
  return models.find((m) => m.slug === slug) ?? null;
}
```

- [ ] **Step 5: Spustit test — musí projít**

Run: `npx vitest run tests/unit/data-models.test.ts`
Expected: PASS (4 testy).

- [ ] **Step 6: Commit**

```bash
git add lib/data/models.ts tests/unit/data-models.test.ts tsconfig.json
git commit -m "feat(data): add JSON-backed models reading layer (listModels, getModel)"
```

---

## Task 4: Přepojit 7 konzumentů z drizzle na čtecí vrstvu

Každý soubor: nahradit `import { db, schema } from "@/lib/db"` (+ `eq`/drizzle) helpery z `@/lib/data/models`. Zachovat přesně stejný tvar dat a pořadí.

**Files (Modify):**
- `app/modely/[slug]/page.tsx`
- `app/modely/page.tsx`
- `app/page.tsx`
- `app/sitemap.ts`
- `app/llms.txt/route.ts`
- `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx`
- `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx`

- [ ] **Step 1: `app/modely/[slug]/page.tsx`**

Nahradit horní import a tři DB funkce:

```ts
// nahradit řádky 4-5:
import { getModel, listModels } from "@/lib/data/models";
// (odstranit `import { db, schema } from "@/lib/db"` a `import { eq } from "drizzle-orm"`)
```

```ts
// nahradit fetchModel:
async function fetchModel(slug: string) {
  return getModel(slug);
}

// nahradit fetchSiblings:
async function fetchSiblings(_currentSlug: string) {
  return listModels().map((m) => ({
    slug: m.slug,
    name: m.name,
    heroImageUrl: m.heroImageUrl,
    category: m.category,
    productionStart: m.productionStart,
    productionEnd: m.productionEnd,
  }));
}

// nahradit generateStaticParams:
export async function generateStaticParams() {
  return listModels().map((m) => ({ slug: m.slug }));
}
```

- [ ] **Step 2: `app/modely/page.tsx`** — nahradit import (řádek 2) a `fetchModels`:

```ts
import { listModels } from "@/lib/data/models";
```

```ts
async function fetchModels() {
  return listModels().map((m) => ({
    slug: m.slug,
    name: m.name,
    nameFull: m.nameFull,
    category: m.category,
    productionStart: m.productionStart,
    productionEnd: m.productionEnd,
    heroImageUrl: m.heroImageUrl,
    wikidataQid: m.wikidataQid,
  }));
}
```

- [ ] **Step 3: `app/page.tsx`** — najít blok `db.select({...}).from(schema.models).orderBy(schema.models.slug)` (řádky ~118-130) a import. Nahradit import za `import { listModels } from "@/lib/data/models";` a dotaz za:

```ts
const models = listModels().map((m) => ({
  slug: m.slug,
  name: m.name,
  nameFull: m.nameFull,
  category: m.category,
  productionStart: m.productionStart,
  productionEnd: m.productionEnd,
  heroImageUrl: m.heroImageUrl,
  wikidataQid: m.wikidataQid,
}));
```

(Pozn.: ověřit, zda je dotaz obalen try/catch nebo ve funkci — zachovat okolní strukturu, jen vyměnit zdroj dat. Pokud byl v `try { ... } catch { return [] }`, lze ponechat try/catch nebo zjednodušit — listModels neselhává.)

- [ ] **Step 4: `app/sitemap.ts`** — nahradit import (řádek 2) a model blok (řádky 20-33):

```ts
import { listModels } from "@/lib/data/models";
```

```ts
  const modelRoutes: MetadataRoute.Sitemap = listModels().map((m) => ({
    url: `${BASE}/modely/${m.slug}`,
    lastModified: new Date(m.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
```

(`new Date(m.updatedAt)` zrcadlí původní `Date` typ z drizzle → identický `<lastmod>`.)

- [ ] **Step 5: `app/llms.txt/route.ts`** — nahradit import (řádek 1) a dotaz (řádky 8-27):

```ts
import { listModels } from "@/lib/data/models";
```

```ts
  const rows = listModels().map((m) => ({
    slug: m.slug,
    name: m.nameFull,
    category: m.category,
    start: m.productionStart,
    end: m.productionEnd,
  }));
  const modelsBlock = rows
    .map(
      (m) =>
        `- ${m.name} (${m.category}, ${m.start ?? "?"}${m.end ? `–${m.end}` : "–dosud"}): https://czechsubaruclub.cz/modely/${m.slug}`,
    )
    .join("\n");
```

(Odstranit `let modelsBlock = ""` + try/catch; `modelsBlock` je teď `const`. Zbytek šablony beze změny.)

- [ ] **Step 6: `app/kviz/.../vysledek/[slug]/page.tsx`** — nahradit import a `db.select().from(schema.models).where(eq(schema.models.slug, slug))` za `getModel(slug)`:

```ts
import { getModel } from "@/lib/data/models";
```
Najít fetch funkci (řádky ~15-21) a nahradit její tělo za `return getModel(slug);` (zachovat signaturu/název). Odstranit `eq` import pokud zůstal nepoužitý.

- [ ] **Step 7: `app/kviz/.../vysledek/[slug]/opengraph-image.tsx`** — stejně:

```ts
import { getModel } from "@/lib/data/models";
```
Nahradit `db.select({ name: schema.models.name }).from(...).where(eq(...))` za `getModel(slug)` a používat `.name`. Odstranit drizzle importy.

- [ ] **Step 8: Ověřit, že nikde nezůstal import z `@/lib/db`**

Run: `grep -rn "@/lib/db\|drizzle-orm" app`
Expected: žádný výstup.

- [ ] **Step 9: Typecheck + testy + build**

Run: `npx tsc --noEmit && npx vitest run && rm -rf .next out && npm run build`
Expected: tsc bez chyb, testy projdou, build vygeneruje `out/`.

- [ ] **Step 10: Commit**

```bash
git add app/
git commit -m "refactor(app): read models from data layer instead of drizzle/DB"
```

---

## Task 5: Build-parity verifikace

**Files:** žádné

- [ ] **Step 1: Snapshot nového výstupu**

Run: `rm -rf /tmp/out-new && cp -R out /tmp/out-new`

- [ ] **Step 2: Diff proti baseline**

Run: `diff -r /tmp/out-baseline /tmp/out-new`
Expected: rozdíly POUZE v `<lastmod>` hodnotách v `sitemap.xml` (statické + kvízové routy mají `new Date()`). Žádné rozdíly v `modely/**`, `llms.txt`, OG PNG, `index.html`, ani v řádcích `/modely/<slug>` v sitemapě.

- [ ] **Step 3: Cílený diff sitemapy (potvrdit, že se liší jen lastmod)**

Run: `diff <(grep -o '<loc>[^<]*</loc>' /tmp/out-baseline/sitemap.xml) <(grep -o '<loc>[^<]*</loc>' /tmp/out-new/sitemap.xml)`
Expected: žádný rozdíl (stejné URL = stejná struktura sitemapy).

- [ ] **Step 4: Pokud diff ukazuje víc než lastmod** → STOP, vyšetřit (systematic-debugging). Typické příčiny: jiné řazení (localeCompare vs byte), chybějící pole v JSON, jiná serializace `updatedAt`. Neopravovat naslepo.

- [ ] **Step 5: Žádný commit** (jen verifikace). Pokračovat až po čistém diffu.

---

## Task 6: Přepsat enrichment skripty na JSON in/out (varianta a)

**Files:**
- Create: `lib/data/models-file.ts` (fs-based read/write — sdílené skripty)
- Test: `tests/unit/models-file.test.ts`
- Modify: `scripts/research/seed-models.ts`
- Modify: `scripts/research/enrich-models-wikidata.ts`
- Modify: `scripts/research/enrich-models-wikipedia.ts`
- Modify: `scripts/research/audit.ts`

- [ ] **Step 1: Failing test pro fs vrstvu**

`tests/unit/models-file.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { serializeModels } from "@/lib/data/models-file";
import type { Model } from "@/lib/data/models";

const sample: Model[] = [
  { id: "2", slug: "zebra", name: "Z", nameFull: "Z", taglineCs: null, descriptionCs: null, descriptionEnRaw: null, category: "suv", productionStart: 2000, productionEnd: null, heroImageUrl: null, wikidataQid: null, contentTier: "bronze", createdAt: "2020-01-01T00:00:00.000Z", updatedAt: "2020-01-01T00:00:00.000Z" },
  { id: "1", slug: "alpha", name: "A", nameFull: "A", taglineCs: null, descriptionCs: null, descriptionEnRaw: null, category: "suv", productionStart: 1990, productionEnd: null, heroImageUrl: null, wikidataQid: null, contentTier: "bronze", createdAt: "2020-01-01T00:00:00.000Z", updatedAt: "2020-01-01T00:00:00.000Z" },
];

describe("models-file serialize", () => {
  it("sorts by slug and ends with newline", () => {
    const out = serializeModels(sample);
    const parsed = JSON.parse(out);
    expect(parsed.map((m: Model) => m.slug)).toEqual(["alpha", "zebra"]);
    expect(out.endsWith("\n")).toBe(true);
  });
});
```

- [ ] **Step 2: Spustit — FAIL**

Run: `npx vitest run tests/unit/models-file.test.ts`
Expected: FAIL (`Cannot find module '@/lib/data/models-file'`).

- [ ] **Step 3: Napsat fs vrstvu**

`lib/data/models-file.ts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Model } from "./models";

const FILE = resolve(process.cwd(), "data/models.json");

export function readModelsFile(): Model[] {
  return JSON.parse(readFileSync(FILE, "utf8")) as Model[];
}

/** Deterministic serialization: sorted by slug (byte order), 2-space indent, trailing newline. */
export function serializeModels(models: Model[]): string {
  const sorted = [...models].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return JSON.stringify(sorted, null, 2) + "\n";
}

export function writeModelsFile(models: Model[]): void {
  writeFileSync(FILE, serializeModels(models));
}
```

- [ ] **Step 4: Spustit — PASS**

Run: `npx vitest run tests/unit/models-file.test.ts`
Expected: PASS.

- [ ] **Step 5: Přepsat `seed-models.ts`** (merge seed-data → models.json, zachovat ruční pole):

```ts
import { readModelsFile, writeModelsFile } from "@/lib/data/models-file";
import type { Model } from "@/lib/data/models";
import seedData from "./seed-data/subaru-models.json" with { type: "json" };

type SeedEntry = {
  slug: string; name: string; nameFull: string;
  wikipediaEnTitle: string; wikidataQid: string; category: string;
  productionStart?: number; productionEnd?: number;
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
```

- [ ] **Step 6: Přepsat `enrich-models-wikidata.ts`** — zachovat `--dry-run`/`--only`, zdroj/cíl = JSON:

```ts
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
  if (targets.length === 0) { console.error(`[wikidata] No models (filter: ${onlySlug ?? "ALL"})`); process.exit(1); }

  let updated = 0, skipped = 0, errors = 0, changedAny = false;
  for (const m of targets) {
    if (!m.wikidataQid) { console.warn(`[wikidata] ✗ ${m.slug} no qid`); skipped++; continue; }
    try {
      const core = extractModelCore(await fetchWikidataEntity(m.wikidataQid, userAgent));
      const changes: string[] = [];
      if (core.imageUrl && core.imageUrl !== m.heroImageUrl) {
        changes.push(`hero_image_url=${core.imageUrl.slice(0, 60)}...`);
        if (!dryRun) { m.heroImageUrl = core.imageUrl; m.updatedAt = new Date().toISOString(); changedAny = true; }
      }
      if (core.inceptionYear && m.productionStart !== null && core.inceptionYear !== m.productionStart) {
        changes.push(`production_start: JSON=${m.productionStart}, Wiki=${core.inceptionYear} (NOT overwriting)`);
      }
      if (changes.length === 0) console.log(`[wikidata] = ${m.slug}`);
      else { console.log(`[wikidata] ${dryRun ? "~" : "✓"} ${m.slug}: ${changes.join(", ")}`); updated++; }
    } catch (err) {
      console.error(`[wikidata] ✗ ${m.slug} FAILED: ${err instanceof Error ? err.message : String(err)}`); errors++;
    }
  }

  if (!dryRun && changedAny) writeModelsFile(models);
  console.log(`[wikidata] Done. updated=${updated} skipped=${skipped} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => { console.error("[wikidata] FATAL:", err); process.exit(1); });
```

- [ ] **Step 7: Přepsat `enrich-models-wikipedia.ts`** — zachovat `--dry-run`/`--only`/`--overwrite`:

```ts
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
  if (targets.length === 0) { console.error(`[wikipedia] No models (filter: ${onlySlug ?? "ALL"})`); process.exit(1); }

  let updated = 0, skipped = 0, errors = 0, changedAny = false;
  for (const m of targets) {
    if (!m.wikidataQid) { console.warn(`[wikipedia] ✗ ${m.slug} no qid`); skipped++; continue; }
    try {
      const { cs, en } = await fetchCsEnSummariesByQid(m.wikidataQid, userAgent);
      const changes: string[] = [];
      let touched = false;
      if (cs?.extract && (overwrite || !m.descriptionCs)) {
        changes.push(`description_cs: +${cs.extract.length} chars`);
        if (!dryRun) { m.descriptionCs = cs.extract; touched = true; }
      } else if (cs?.extract && m.descriptionCs && !overwrite) changes.push(`description_cs: exists (skip)`);
      else if (!cs) changes.push(`description_cs: NO CS WIKIPEDIA`);

      if (en?.extract && (overwrite || !m.descriptionEnRaw)) {
        changes.push(`description_en_raw: +${en.extract.length} chars`);
        if (!dryRun) { m.descriptionEnRaw = en.extract; touched = true; }
      } else if (en?.extract && m.descriptionEnRaw && !overwrite) changes.push(`description_en_raw: exists (skip)`);
      else if (!en) changes.push(`description_en_raw: NO EN WIKIPEDIA`);

      if (touched) { m.updatedAt = new Date().toISOString(); changedAny = true; }
      if (changes.every((c) => c.includes("exists") || c.includes("NO "))) console.log(`[wikipedia] = ${m.slug} (${changes.join("; ")})`);
      else { console.log(`[wikipedia] ${dryRun ? "~" : "✓"} ${m.slug}: ${changes.join("; ")}`); updated++; }
    } catch (err) {
      console.error(`[wikipedia] ✗ ${m.slug} FAILED: ${err instanceof Error ? err.message : String(err)}`); errors++;
    }
  }

  if (!dryRun && changedAny) writeModelsFile(models);
  console.log(`[wikipedia] Done. updated=${updated} skipped=${skipped} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => { console.error("[wikipedia] FATAL:", err); process.exit(1); });
```

- [ ] **Step 8: Přepsat `audit.ts`** — čte JSON, počítá totéž (generations/trims jsou archivní JSON nebo 0):

```ts
import { readModelsFile } from "@/lib/data/models-file";

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function main() {
  console.log("=== CzechSubaruClub content audit ===\n");
  const models = readModelsFile();

  const tierCounts = new Map<string, number>();
  for (const m of models) tierCounts.set(m.contentTier, (tierCounts.get(m.contentTier) ?? 0) + 1);
  console.log("Tier distribution:");
  for (const [tier, count] of [...tierCounts].sort()) console.log(`  ${tier.padEnd(10)} ${count}`);

  const total = models.length;
  const withImage = models.filter((m) => m.heroImageUrl).length;
  const withTagline = models.filter((m) => m.taglineCs).length;
  const withDescription = models.filter((m) => m.descriptionCs).length;
  const withEnRaw = models.filter((m) => m.descriptionEnRaw).length;

  console.log("\nCompleteness:");
  console.log(`  Total models           ${total}`);
  console.log(`  Hero image             ${withImage}/${total} (${pct(withImage, total)}%)`);
  console.log(`  Tagline CS             ${withTagline}/${total} (${pct(withTagline, total)}%)`);
  console.log(`  Description CS         ${withDescription}/${total} (${pct(withDescription, total)}%)`);
  console.log(`  Description EN raw     ${withEnRaw}/${total} (${pct(withEnRaw, total)}%)`);

  const missingImage = models.filter((m) => !m.heroImageUrl);
  if (missingImage.length > 0) {
    console.log(`\nMissing hero_image_url (${missingImage.length}):`);
    for (const m of missingImage) console.log(`  - ${m.slug.padEnd(15)} qid=${m.wikidataQid ?? "MISSING"}`);
  }
}

main();
```

- [ ] **Step 9: Smoke-test skriptů (read-only / dry-run, ať nezašpiní JSON)**

Run: `npx tsx scripts/research/audit.ts && npx tsx scripts/research/enrich-models-wikidata.ts --dry-run --only=$(node -e "console.log(require('./data/models.json')[0].slug)")`
Expected: audit vypíše tier/completeness; wikidata dry-run proběhne bez zápisu (git status čistý na data/models.json).

- [ ] **Step 10: Ověřit, že JSON nebyl dry-runem změněn**

Run: `git status --short data/models.json`
Expected: žádný výstup (beze změny).

- [ ] **Step 11: Commit**

```bash
git add lib/data/models-file.ts tests/unit/models-file.test.ts scripts/research/
git commit -m "refactor(scripts): enrichment reads/writes data/models.json (no DB)"
```

---

## Task 7: Úklid — drop DB vrstvy, deps, env, docs

**Files:**
- Delete: `lib/db/` (celé), `drizzle/`, `drizzle.config.ts`
- Modify: `package.json` (deps + scripts), `lib/env.ts`, `.env.local`, `.env.local.example`, `CLAUDE.md`

- [ ] **Step 1: Najít konzumenty `@/lib/env` (DB pole)**

Run: `grep -rn "@/lib/env\|from \"@/lib/env\"" app lib scripts`
Expected: zjistit, kdo importuje `env`. Po dropnutí lib/db pravděpodobně nikdo (db/index.ts byl jediný). Pokud někdo používá `env.NEXT_PUBLIC_*`, viz Step 4.

- [ ] **Step 2: Smazat DB vrstvu a drizzle**

```bash
git rm -r lib/db drizzle drizzle.config.ts
```

- [ ] **Step 3: Odstranit deps a db:* skripty z `package.json`**

Odebrat z `dependencies`: `drizzle-orm`, `postgres`. Odebrat z `devDependencies`: `drizzle-kit`. Odebrat ze `scripts`: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
Pak: `rm -rf node_modules pnpm-lock.yaml && pnpm install` (regenerace locku bez DB deps).

- [ ] **Step 4: Vyčistit `lib/env.ts`** — odebrat DB/Supabase pole (zachovat jen reálně používané `NEXT_PUBLIC_*` analytics + `WIKIPEDIA_USER_AGENT`):

```ts
import { z } from "zod";

const envSchema = z.object({
  WIKIPEDIA_USER_AGENT: z.string().default("czechsubaruclub.cz pipeline"),
  NEXT_PUBLIC_GA_ID: z.string().default(""),
  NEXT_PUBLIC_GSC_VERIFY: z.string().default(""),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().default(""),
});

export const env = envSchema.parse({
  WIKIPEDIA_USER_AGENT: process.env.WIKIPEDIA_USER_AGENT,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_GSC_VERIFY: process.env.NEXT_PUBLIC_GSC_VERIFY,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
});
```

(Pokud Step 1 ukázal, že `env` nikdo neimportuje, lze `lib/env.ts` rovnou smazat: `git rm lib/env.ts`. Rozhodnout dle výstupu Step 1.)

- [ ] **Step 5: Odebrat DB env vars z `.env.local` a `.env.local.example`**

V obou souborech smazat řádky `DATABASE_URL`, `DIRECT_DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`. (`.env.local` se NEcommituje — uprav jen lokálně; commituj jen `.env.local.example`.)

- [ ] **Step 6: Aktualizovat `CLAUDE.md`** — sekci „DB konvence" a řádek o Drizzle nahradit za JSON přístup:

V „Stack & vzory" nahradit řádek o Drizzle za:
```
- Data: `data/models.json` (source of truth), čteno přes `lib/data/models.ts`. ŽÁDNÁ DB.
```
Celou sekci „## DB konvence" nahradit za:
```
## Data konvence

- Source of truth = `data/models.json` (commitnuto). App ho čte přes `lib/data/models.ts` (`listModels`/`getModel`).
- Enrichment skripty (`scripts/research/*`) čtou/píšou `data/models.json` přes `lib/data/models-file.ts`.
- Ruční editace polí (tagline, gold overlay přes `content_tier`) = přímá editace `data/models.json`.
- `content_tier`: `bronze` (jen pipeline) | `silver` (+ CZ tagline) | `gold` (+ plný CZ overlay).
```

- [ ] **Step 7: Typecheck + testy + čistý build**

Run: `npx tsc --noEmit && npx vitest run && rm -rf .next out && npm run build`
Expected: vše projde BEZ jakéhokoli `DATABASE_URL` v prostředí. (Pro jistotu lze build spustit s `env -u DATABASE_URL`.)

- [ ] **Step 8: Build-parity ještě jednou (proti baseline)**

Run: `rm -rf /tmp/out-clean && cp -R out /tmp/out-clean && diff -r /tmp/out-baseline /tmp/out-clean`
Expected: opět rozdíly jen v sitemap `<lastmod>`.

- [ ] **Step 9: Ověřit, že build nepotřebuje DB**

Run: `grep -rn "DATABASE_URL\|obhypfuzmknvmknskdwh\|drizzle\|postgres" app lib scripts package.json | grep -v export-db-to-json`
Expected: žádné odkazy na DB v runtime/buildu (jen jednorázový export skript smí zmiňovat postgres/DATABASE_URL).

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml lib/env.ts .env.local.example CLAUDE.md
git commit -m "chore: remove DB layer, drizzle/postgres deps, and DB env vars"
```

---

## Task 8: Finální build, deploy a live verifikace

**Files:** žádné

- [ ] **Step 1: Finální čistý build**

Run: `cd ~/czechsubaruclub-db-decouple && rm -rf .next out && npm run build`
Expected: úspěch, `out/` kompletní.

- [ ] **Step 2: Merge feature branch → deploy branch**

Sloučit `feat/odstrihnout-od-db` do `chore/static-export` (deploy větev). Použít finishing-a-development-branch skill (PR nebo přímý merge dle preference uživatele). NIKDY `git add -A`.

- [ ] **Step 3: Deploy**

Run: `npm run deploy` (= `bash scripts/deploy.sh`, beze změny).
Expected: `out/` nahráno na Hostinger.

- [ ] **Step 4: Live verifikace**

Ověřit na czechsubaruclub.cz:
- `/modely` — katalog se zobrazuje, počet modelů sedí.
- `/modely/<slug>` — detail modelu (hero foto, popis, prev/next).
- `/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/<slug>` — výsledek + OG.
- `/sitemap.xml` — obsahuje všechny modely.
- `/llms.txt` — seznam modelů.
Expected: vše identické jako před změnou.

- [ ] **Step 5: agro-svet netknutý**

Ověřit, že na sdílené DB `obhypfuzmknvmknskdwh` se nesahalo do `public` (agro-svet) — export byl read-only na `subaruclub`. Žádná akce, jen potvrzení v handoffu.

---

## Definition of Done

- [ ] czechsubaruclub buildí a deployuje bez `DATABASE_URL` (Task 7 Step 7 + 9).
- [ ] `data/models.json` je source of truth, commitnuto (Task 1).
- [ ] Live web identický (Task 8 Step 4).
- [ ] Enrichment workflow funkční bez DB (Task 6).
- [ ] `drizzle-orm`/`postgres`/`drizzle-kit` + `lib/db/` + `drizzle/` odstraněny (Task 7).
- [ ] `obhypfuzmknvmknskdwh` už czechsubaruclub neobsluhuje → připraveno na single-tenant migraci agro-svet DB.
- [ ] Aktualizovat paměť `project-migrace-weby-vps-hostinger` (czechsubaruclub odstřižen).
