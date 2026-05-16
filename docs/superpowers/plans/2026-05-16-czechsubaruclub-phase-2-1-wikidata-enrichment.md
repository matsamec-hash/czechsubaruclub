# CzechSubaruClub Phase 2.1: Wikidata Models Enrichment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit foundation pipeline library (throttled HTTP fetcher, Wikidata client) a aplikovat ji na všech 27 modelů v DB — naplnit `hero_image_url` z P18 a ověřit `production_start` z P571. Po tomto plánu má každý model v `subaruclub.models` aspoň ⅔ Wikidata-derived data nebo flag indikující že QID je špatný.

**Architecture:** Standalone TS scripty v `scripts/research/`, sdílená library v `lib/pipeline/`. Tests Vitest s mock HTTP. Žádný UI dopad — všechno je DB-only. Throttle pravidlo 1 req/s + User-Agent header s contact emailem (Wikipedia/Wikidata API podmínka).

**Tech Stack:** Node.js (tsx runner), Drizzle ORM, `undici` fetch (nebo native fetch), `p-throttle` pro rate limiting, Vitest + MSW (mock HTTP) pro testy.

**Spec reference:** `~/czechsubaruclub/docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md` sekce 6.2, 6.3.

**Prerequisites:**
- Phase 0+1 shipped (subaruclub schema, 27 modelů bronze tier)
- DB password v `~/czechsubaruclub/.env.local` (Task 0)

---

## File Structure

```
~/czechsubaruclub/
├── lib/
│   └── pipeline/
│       ├── fetch.ts                       — HTTP fetch s throttle + UA + retry
│       ├── wikidata.ts                    — Wikidata API wrapper
│       └── types.ts                       — WikidataEntity, WikidataClaim, FetchOptions types
├── scripts/
│   └── research/
│       ├── enrich-models-wikidata.ts      — orchestrator (dry-run + apply mode)
│       └── audit.ts                       — content_tier distribution report
├── tests/
│   └── unit/
│       └── pipeline/
│           ├── fetch.test.ts              — throttle, UA header, retry behavior
│           └── wikidata.test.ts           — claim parsing, P18 image URL build
└── .env.local                             — DATABASE_URL doplněn
```

---

### Task 0: USER akce — reset DB password + sync env vars

**Files:**
- Modify: `~/czechsubaruclub/.env.local`
- Vercel: env vars pro production/preview/development

- [ ] **Step 1: USER reset DB password v Supabase Dashboard**

User otevře https://supabase.com/dashboard/project/obhypfuzmknvmknskdwh/settings/database → sekce **Database password** → **Reset database password** → uloží silné heslo do 1Password.

**Risk check**: před resetem ověř, že content-network deploy nemá DATABASE_URL nikde nakonfigurované (per minulý audit nemá — používá jen anon/service keys přes JS client). Pokud user pamatuje že staré heslo někde drží, prefer **NEresetovat** a vytáhnout heslo z 1Password.

- [ ] **Step 2: USER pošle connection string**

User zkopíruje z Supabase → Database settings → **Connection string** → **Transaction mode** URI (port 6543 — pro Drizzle runtime queries).

Plus zkopíruje **Direct connection** URI (port 5432 — pro DDL migrace).

- [ ] **Step 3: Doplnit `.env.local`**

Edit `~/czechsubaruclub/.env.local`:
```bash
DATABASE_URL="postgresql://postgres.obhypfuzmknvmknskdwh:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
DIRECT_DATABASE_URL="postgresql://postgres.obhypfuzmknvmknskdwh:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://obhypfuzmknvmknskdwh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_KEY="<service-key>"
WIKIPEDIA_USER_AGENT="czechsubaruclub.cz pipeline / info@samecdigital.com"
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_ADSENSE_CLIENT_ID=""
```

Hodnoty pro anon/service key vezmeme z `~/content-network-cms/.env.local`.

- [ ] **Step 4: Verify connection**

Run:
```bash
cd ~/czechsubaruclub
source ~/.nvm/nvm.sh && nvm use 22 2>&1 | tail -1
pnpm tsx -e "import('./lib/db').then(({db,schema})=>db.select().from(schema.models).then(r=>{console.log('Models:',r.length); process.exit(0)}).catch(e=>{console.error(e.message); process.exit(1)}))"
```
Expected: `Models: 27`.

Pokud failuje s connection error, ověř password (časté: special chars musí být URL-encoded).

- [ ] **Step 5: Sync env vars do Vercelu**

```bash
cd ~/czechsubaruclub
echo "<DATABASE_URL value>" | vercel env add DATABASE_URL production
echo "<DATABASE_URL value>" | vercel env add DATABASE_URL preview
echo "<DATABASE_URL value>" | vercel env add DATABASE_URL development
# Opakuj pro: DIRECT_DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, WIKIPEDIA_USER_AGENT
```
**Pozor**: žádné trailing newlines (per `feedback_vercel_env_newline.md`).

Verify: `vercel env ls production | grep DATABASE_URL`.

- [ ] **Step 6: Commit (jen kdyby se .env.local.example změnil, jinak skip)**

Nothing to commit — `.env.local` je v `.gitignore`.

---

### Task 1: Install pipeline dependencies

**Files:**
- Modify: `~/czechsubaruclub/package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime deps**

```bash
source ~/.nvm/nvm.sh && nvm use 22 2>&1 | tail -1
cd ~/czechsubaruclub
pnpm add p-throttle p-retry
```
Expected: `p-throttle 6.x` + `p-retry 6.x` přidané v dependencies.

- [ ] **Step 2: Install test deps (MSW pro mock HTTP)**

```bash
cd ~/czechsubaruclub
pnpm add -D msw@^2 @types/node@^22
```
Expected: `msw 2.x` v devDependencies.

- [ ] **Step 3: Verify install**

Run: `cd ~/czechsubaruclub && pnpm test 2>&1 | tail -5`
Expected: `12 passed (12)` (existing tests stále green).

- [ ] **Step 4: Commit**

```bash
cd ~/czechsubaruclub
git add package.json pnpm-lock.yaml
git commit -m "chore: add pipeline deps (p-throttle, p-retry, msw)"
git push origin main
```

---

### Task 2: Pipeline types (lib/pipeline/types.ts)

**Files:**
- Create: `~/czechsubaruclub/lib/pipeline/types.ts`

- [ ] **Step 1: Vytvoř adresář + types**

Run: `mkdir -p ~/czechsubaruclub/lib/pipeline`

Create file `~/czechsubaruclub/lib/pipeline/types.ts`:
```ts
export type FetchOptions = {
  userAgent?: string;
  timeoutMs?: number;
  retries?: number;
};

export type WikidataClaim = {
  property: string;
  value: string | number | { id: string } | null;
  rank: "preferred" | "normal" | "deprecated";
};

export type WikidataEntity = {
  qid: string;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  claims: Record<string, WikidataClaim[]>;
};

export type WikidataModelCore = {
  qid: string;
  imageFileName: string | null;
  imageUrl: string | null;
  inceptionYear: number | null;
  manufacturer: string | null;
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd ~/czechsubaruclub && pnpm tsc --noEmit 2>&1 | tail -5`
Expected: žádné errors.

- [ ] **Step 3: Commit**

```bash
cd ~/czechsubaruclub
git add lib/pipeline/types.ts
git commit -m "feat: add pipeline types (Wikidata + enrichment)"
git push origin main
```

---

### Task 3: HTTP fetcher s throttle + UA (lib/pipeline/fetch.ts) — TDD

**Files:**
- Create: `~/czechsubaruclub/lib/pipeline/fetch.ts`
- Create: `~/czechsubaruclub/tests/unit/pipeline/fetch.test.ts`

- [ ] **Step 1: Napsat failující test**

Run: `mkdir -p ~/czechsubaruclub/tests/unit/pipeline`

Create file `~/czechsubaruclub/tests/unit/pipeline/fetch.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttledFetch, resetThrottle } from "@/lib/pipeline/fetch";

describe("throttledFetch", () => {
  beforeEach(() => {
    resetThrottle();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("posílá User-Agent header", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const promise = throttledFetch("https://example.com/api", {
      userAgent: "test-agent",
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "test-agent",
        }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("throttluje 1 req/s — druhý request čeká", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const p1 = throttledFetch("https://a", { userAgent: "t" });
    const p2 = throttledFetch("https://b", { userAgent: "t" });

    // First fires immediately
    await vi.advanceTimersByTimeAsync(10);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second waits ~1000ms
    await vi.advanceTimersByTimeAsync(900);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    await p1;
    await p2;
    fetchSpy.mockRestore();
  });

  it("retry při 503 (3 pokusy)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const promise = throttledFetch("https://x", {
      userAgent: "t",
      retries: 3,
    });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(200);
    fetchSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Spustit test, ověřit fail**

Run: `cd ~/czechsubaruclub && pnpm test tests/unit/pipeline/fetch.test.ts 2>&1 | tail -10`
Expected: FAIL — `Cannot find module '@/lib/pipeline/fetch'`.

- [ ] **Step 3: Implementuj fetch.ts**

Create file `~/czechsubaruclub/lib/pipeline/fetch.ts`:
```ts
import pThrottle from "p-throttle";
import pRetry from "p-retry";
import type { FetchOptions } from "./types";

const DEFAULT_USER_AGENT = "czechsubaruclub.cz pipeline / info@samecdigital.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;

let throttle = pThrottle({ limit: 1, interval: 1000 });

export function resetThrottle() {
  throttle = pThrottle({ limit: 1, interval: 1000 });
}

const throttledRaw = (url: string, init: RequestInit) =>
  throttle(() => fetch(url, init))();

export async function throttledFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await pRetry(
      async () => {
        const res = await throttledRaw(url, {
          headers: {
            "User-Agent": userAgent,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
        if (res.status >= 500 || res.status === 429) {
          throw new Error(`Retryable HTTP ${res.status} for ${url}`);
        }
        return res;
      },
      {
        retries,
        minTimeout: 500,
        factor: 2,
      },
    );
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: Spustit test, ověřit pass**

Run: `cd ~/czechsubaruclub && pnpm test tests/unit/pipeline/fetch.test.ts 2>&1 | tail -10`
Expected: `3 passed (3)`.

- [ ] **Step 5: Commit**

```bash
cd ~/czechsubaruclub
git add lib/pipeline/fetch.ts tests/unit/pipeline/fetch.test.ts
git commit -m "feat: add throttled HTTP fetcher with retry"
git push origin main
```

---

### Task 4: Wikidata client (lib/pipeline/wikidata.ts) — TDD

**Files:**
- Create: `~/czechsubaruclub/lib/pipeline/wikidata.ts`
- Create: `~/czechsubaruclub/tests/unit/pipeline/wikidata.test.ts`
- Create: `~/czechsubaruclub/tests/unit/pipeline/fixtures/wikidata-Q834945.json`

- [ ] **Step 1: Stáhni Wikidata response pro Impreza jako fixture**

```bash
cd ~/czechsubaruclub
mkdir -p tests/unit/pipeline/fixtures
curl -sH "User-Agent: czechsubaruclub.cz pipeline / info@samecdigital.com" \
  "https://www.wikidata.org/wiki/Special:EntityData/Q834945.json" \
  > tests/unit/pipeline/fixtures/wikidata-Q834945.json
wc -c tests/unit/pipeline/fixtures/wikidata-Q834945.json
```
Expected: file > 50 KB (Wikidata responses jsou velké).

- [ ] **Step 2: Napiš failující test**

Create file `~/czechsubaruclub/tests/unit/pipeline/wikidata.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "./fixtures/wikidata-Q834945.json" with { type: "json" };
import {
  parseWikidataEntity,
  extractModelCore,
  buildCommonsImageUrl,
} from "@/lib/pipeline/wikidata";

describe("parseWikidataEntity", () => {
  it("parsuje Impreza Q834945 do strukturované entity", () => {
    const entity = parseWikidataEntity(fixture, "Q834945");
    expect(entity.qid).toBe("Q834945");
    expect(entity.labels.en).toContain("Impreza");
    expect(Object.keys(entity.claims).length).toBeGreaterThan(5);
  });
});

describe("extractModelCore", () => {
  it("extrahuje P18 (image), P571 (inception)", () => {
    const entity = parseWikidataEntity(fixture, "Q834945");
    const core = extractModelCore(entity);

    expect(core.qid).toBe("Q834945");
    expect(core.imageFileName).toBeTruthy();
    expect(core.imageUrl).toMatch(
      /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//,
    );
    expect(core.inceptionYear).toBeGreaterThanOrEqual(1990);
    expect(core.inceptionYear).toBeLessThanOrEqual(1995);
  });

  it("vrátí null pro chybějící claims", () => {
    const entity = {
      qid: "Q1",
      labels: {},
      descriptions: {},
      claims: {},
    };
    const core = extractModelCore(entity);
    expect(core.imageUrl).toBeNull();
    expect(core.inceptionYear).toBeNull();
  });
});

describe("buildCommonsImageUrl", () => {
  it("vrátí Commons URL pro file name", () => {
    const url = buildCommonsImageUrl("Subaru Impreza WRX STI.jpg");
    expect(url).toMatch(/upload\.wikimedia\.org\/wikipedia\/commons\//);
    expect(url).toContain("Subaru_Impreza_WRX_STI.jpg");
  });

  it("URL-encoduje special chars", () => {
    const url = buildCommonsImageUrl("Auto&Co.jpg");
    expect(url).toContain("Auto%26Co.jpg");
  });
});
```

- [ ] **Step 3: Spustit test, ověřit fail**

Run: `cd ~/czechsubaruclub && pnpm test tests/unit/pipeline/wikidata.test.ts 2>&1 | tail -10`
Expected: FAIL — `Cannot find module '@/lib/pipeline/wikidata'`.

- [ ] **Step 4: Implementuj wikidata.ts**

Create file `~/czechsubaruclub/lib/pipeline/wikidata.ts`:
```ts
import { createHash } from "node:crypto";
import { throttledFetch } from "./fetch";
import type {
  WikidataEntity,
  WikidataClaim,
  WikidataModelCore,
} from "./types";

const ENTITY_URL = (qid: string) =>
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

export async function fetchWikidataEntity(
  qid: string,
  userAgent: string,
): Promise<WikidataEntity> {
  const res = await throttledFetch(ENTITY_URL(qid), { userAgent });
  if (!res.ok) {
    throw new Error(`Wikidata fetch ${qid} returned ${res.status}`);
  }
  const json = await res.json();
  return parseWikidataEntity(json, qid);
}

export function parseWikidataEntity(
  raw: unknown,
  qid: string,
): WikidataEntity {
  const entities = (raw as { entities?: Record<string, unknown> }).entities;
  if (!entities || !entities[qid]) {
    throw new Error(`Wikidata response missing entities[${qid}]`);
  }
  const entity = entities[qid] as Record<string, unknown>;

  const labels = parseLabels(entity.labels);
  const descriptions = parseLabels(entity.descriptions);
  const claims = parseClaims(entity.claims);

  return { qid, labels, descriptions, claims };
}

function parseLabels(
  raw: unknown,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [lang, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === "object" && "value" in v) {
      result[lang] = String((v as { value: unknown }).value);
    }
  }
  return result;
}

function parseClaims(
  raw: unknown,
): Record<string, WikidataClaim[]> {
  const result: Record<string, WikidataClaim[]> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [prop, claimList] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!Array.isArray(claimList)) continue;
    result[prop] = claimList
      .map((c) => parseClaim(prop, c))
      .filter((c): c is WikidataClaim => c !== null);
  }
  return result;
}

function parseClaim(
  property: string,
  raw: unknown,
): WikidataClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const mainsnak = (raw as { mainsnak?: Record<string, unknown> }).mainsnak;
  const rank = ((raw as { rank?: string }).rank ?? "normal") as
    | "preferred"
    | "normal"
    | "deprecated";
  if (!mainsnak || mainsnak.snaktype !== "value") return null;

  const datavalue = mainsnak.datavalue as
    | { type: string; value: unknown }
    | undefined;
  if (!datavalue) return null;

  let value: WikidataClaim["value"] = null;
  if (datavalue.type === "string") {
    value = String(datavalue.value);
  } else if (datavalue.type === "wikibase-entityid") {
    const v = datavalue.value as { id?: string };
    if (v.id) value = { id: v.id };
  } else if (datavalue.type === "time") {
    const v = datavalue.value as { time?: string };
    if (v.time) value = v.time;
  } else if (datavalue.type === "quantity") {
    const v = datavalue.value as { amount?: string };
    if (v.amount) value = parseFloat(v.amount);
  }

  return { property, value, rank };
}

export function extractModelCore(entity: WikidataEntity): WikidataModelCore {
  const imageFileName = firstStringClaim(entity, "P18");
  const inceptionTime = firstStringClaim(entity, "P571");
  const manufacturer = firstEntityClaim(entity, "P176");

  return {
    qid: entity.qid,
    imageFileName,
    imageUrl: imageFileName ? buildCommonsImageUrl(imageFileName) : null,
    inceptionYear: parseInceptionYear(inceptionTime),
    manufacturer,
  };
}

function firstStringClaim(
  entity: WikidataEntity,
  prop: string,
): string | null {
  const claims = entity.claims[prop];
  if (!claims || claims.length === 0) return null;
  const preferred = claims.find((c) => c.rank === "preferred") ?? claims[0];
  return typeof preferred.value === "string" ? preferred.value : null;
}

function firstEntityClaim(
  entity: WikidataEntity,
  prop: string,
): string | null {
  const claims = entity.claims[prop];
  if (!claims || claims.length === 0) return null;
  const preferred = claims.find((c) => c.rank === "preferred") ?? claims[0];
  if (
    preferred.value &&
    typeof preferred.value === "object" &&
    "id" in preferred.value
  ) {
    return (preferred.value as { id: string }).id;
  }
  return null;
}

function parseInceptionYear(time: string | null): number | null {
  if (!time) return null;
  const match = /^[+-]?(\d{4})/.exec(time);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (year < 1950 || year > 2030) return null;
  return year;
}

export function buildCommonsImageUrl(fileName: string): string {
  const normalized = fileName.replace(/ /g, "_");
  const md5 = createHash("md5").update(normalized).digest("hex");
  const encoded = encodeURIComponent(normalized);
  return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${encoded}`;
}
```

- [ ] **Step 5: Spustit test, ověřit pass**

Run: `cd ~/czechsubaruclub && pnpm test tests/unit/pipeline/wikidata.test.ts 2>&1 | tail -10`
Expected: `4 passed (4)`.

Pokud `imageUrl` test failuje, ověř že fixture obsahuje P18 claim — `grep -c '"P18"' tests/unit/pipeline/fixtures/wikidata-Q834945.json`. Pokud ne, Impreza Wikidata neměla P18 — nahraď fixture jiným modelem (Q834907 Forester).

- [ ] **Step 6: Commit**

```bash
cd ~/czechsubaruclub
git add lib/pipeline/wikidata.ts tests/unit/pipeline/wikidata.test.ts tests/unit/pipeline/fixtures/
git commit -m "feat: add Wikidata entity parser with P18 image + P571 inception extraction"
git push origin main
```

---

### Task 5: enrich-models-wikidata.ts — dry-run mode

**Files:**
- Create: `~/czechsubaruclub/scripts/research/enrich-models-wikidata.ts`

- [ ] **Step 1: Vytvoř script s dry-run mode**

Create file `~/czechsubaruclub/scripts/research/enrich-models-wikidata.ts`:
```ts
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
        console.log(`[wikidata] ~ ${m.slug} would update: ${changes.join(", ")}`);
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
```

- [ ] **Step 2: Add npm script**

Edit `~/czechsubaruclub/package.json` — add to `scripts`:
```json
"enrich:models:wikidata": "tsx scripts/research/enrich-models-wikidata.ts"
```

Final scripts block by měl vypadat takhle (relevantní řádky):
```json
"seed:models": "tsx scripts/research/seed-models.ts",
"enrich:models:wikidata": "tsx scripts/research/enrich-models-wikidata.ts"
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd ~/czechsubaruclub && pnpm tsc --noEmit 2>&1 | tail -5`
Expected: žádné errors.

- [ ] **Step 4: Commit**

```bash
cd ~/czechsubaruclub
git add scripts/research/enrich-models-wikidata.ts package.json
git commit -m "feat: add enrich-models-wikidata script (dry-run + apply mode)"
git push origin main
```

---

### Task 6: První běh — dry-run na 1 modelu (Impreza)

**Files:** žádné (jen verification)

- [ ] **Step 1: Dry-run Impreza**

Run:
```bash
cd ~/czechsubaruclub
source ~/.nvm/nvm.sh && nvm use 22 2>&1 | tail -1
pnpm enrich:models:wikidata -- --dry-run --only=impreza 2>&1 | tail -10
```
Expected output (přibližně):
```
[wikidata] Start (dryRun=true, onlySlug=impreza)
[wikidata] Processing 1 models
[wikidata] ~ impreza would update: hero_image_url=https://upload.wikimedia.org/wikipedia/commons/...
[wikidata] Done. updated=1 skipped=0 errors=0
```

Pokud výsledek `= impreza (no changes)` — Wikidata Q834945 nemá P18 image claim. To je legit edge case, jdi na další task.

Pokud `✗ impreza FAILED: <error>` — debugger:
- 404 → wikidataQid je špatný v seed JSON, fix v `seed-data/subaru-models.json` + reseed
- timeout → zvyš `timeoutMs` v fetch.ts options
- parse error → fixture v testu nepokrývá tenhle response shape, doplň

- [ ] **Step 2: Skutečný apply na Impreza**

Run:
```bash
cd ~/czechsubaruclub
pnpm enrich:models:wikidata -- --only=impreza 2>&1 | tail -10
```
Expected: `✓ impreza updated: hero_image_url=...`

- [ ] **Step 3: Ověřit v DB**

```bash
cd ~/czechsubaruclub
pnpm tsx -e "
import('./lib/db').then(async ({db, schema}) => {
  const r = await db.select({
    slug: schema.models.slug,
    image: schema.models.heroImageUrl,
    qid: schema.models.wikidataQid,
  }).from(schema.models).where((t, ops) => ops.eq(t.slug, 'impreza'));
  console.log(r[0]);
  process.exit(0);
});
"
```
Expected: row obsahuje `image: 'https://upload.wikimedia.org/...'` a `qid: 'Q834945'`.

- [ ] **Step 4: Commit (žádné code change, jen ověření)**

Nothing to commit, pokračuj.

---

### Task 7: Run na všech 27 modelech

**Files:** žádné

- [ ] **Step 1: Dry-run na všech**

Run:
```bash
cd ~/czechsubaruclub
source ~/.nvm/nvm.sh && nvm use 22 2>&1 | tail -1
pnpm enrich:models:wikidata -- --dry-run 2>&1 | tee /tmp/wikidata-dry.log | tail -20
```
Expected: `updated=X skipped=Y errors=Z` s X většinou cca 20+ (modelů s P18), Y=0, Z mírný (chybné QIDs).

Skontroluj /tmp/wikidata-dry.log pro modely s `FAILED` — to budou QIDs co Wikidata nezná nebo jsou disambiguation/redirect.

- [ ] **Step 2: Pokud errors >5, oprav QIDs**

Pro každý chybný `FAILED 404` model:
1. Otevři https://www.wikidata.org/wiki/Q<original-qid> — pokud redirectuje na jiný QID, vezmi nový
2. Pokud QID neexistuje, search https://www.wikidata.org/wiki/Special:Search?search=<model+name>+Subaru
3. Update v `scripts/research/seed-data/subaru-models.json`
4. Re-run seed: `pnpm seed:models`
5. Re-run dry-run

Iteruj dokud errors ≤ 2 (akceptujeme že 1-2 obscure JDM modely Wikidata nepokrývá).

- [ ] **Step 3: Apply na všech**

Run:
```bash
cd ~/czechsubaruclub
pnpm enrich:models:wikidata 2>&1 | tee /tmp/wikidata-apply.log | tail -10
```
Expected: `updated=20+ skipped=0-2 errors=0-2`.

- [ ] **Step 4: Verify DB stav**

```bash
cd ~/czechsubaruclub
pnpm tsx -e "
import('./lib/db').then(async ({db, schema}) => {
  const rows = await db.select({
    slug: schema.models.slug,
    hasImage: schema.models.heroImageUrl,
  }).from(schema.models);
  const withImage = rows.filter(r => r.hasImage).length;
  console.log('With hero_image_url:', withImage, '/', rows.length);
  rows.filter(r => !r.hasImage).forEach(r => console.log('  - missing:', r.slug));
  process.exit(0);
});
"
```
Expected: `With hero_image_url: 20+ / 27` + výpis modelů co stále chybí image (ti půjdou ručně nebo přes Wikipedia infobox v Phase 2.2).

- [ ] **Step 5: Commit seed updates (pokud byly)**

```bash
cd ~/czechsubaruclub
git add scripts/research/seed-data/
git diff --cached --stat
# Pokud jsou změny:
git commit -m "fix: correct Wikidata QIDs for models that 404'd"
git push origin main
```

Pokud žádné změny, skip.

---

### Task 8: audit.ts — content_tier distribution report

**Files:**
- Create: `~/czechsubaruclub/scripts/research/audit.ts`

- [ ] **Step 1: Implementuj audit script**

Create file `~/czechsubaruclub/scripts/research/audit.ts`:
```ts
import "dotenv/config";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== CzechSubaruClub content audit ===\n");

  // Tier distribution
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

  // Total models + completeness
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

  // Models missing image (potential issue)
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

  // Generations + trims counts
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
```

- [ ] **Step 2: Add npm script**

Edit `~/czechsubaruclub/package.json` — add to `scripts`:
```json
"audit": "tsx scripts/research/audit.ts"
```

- [ ] **Step 3: Run audit**

Run:
```bash
cd ~/czechsubaruclub
pnpm audit 2>&1 | tail -25
```
Expected output (přibližně):
```
=== CzechSubaruClub content audit ===

Tier distribution:
  bronze     27

Completeness:
  Total models           27
  Hero image             22/27 (81%)
  Tagline CS             0/27 (0%)
  Description CS         0/27 (0%)
  Description EN raw     0/27 (0%)

Missing hero_image_url (5):
  - sambar          qid=Q1142285
  - rex             qid=Q1142270
  ...

Generations: 0
Trims:       0
```

Skutečné hodnoty se budou lišit dle Wikidata coverage.

- [ ] **Step 4: Commit**

```bash
cd ~/czechsubaruclub
git add scripts/research/audit.ts package.json
git commit -m "feat: add content_tier audit script"
git push origin main
```

---

### Task 9: Final verification — tests + build + audit

**Files:** žádné

- [ ] **Step 1: Spusť všechny testy**

Run: `cd ~/czechsubaruclub && pnpm test 2>&1 | tail -10`
Expected: 18+ tests passed (12 existing + 6 nové z fetch.test + wikidata.test).

Pokud nějaký test failuje:
- Throttle test flake: timing-sensitive, retry 2-3×
- Wikidata fixture: pokud Wikidata změnila response shape, regeneruj fixture (`curl ... > fixtures/...`) a updatuj assertions

- [ ] **Step 2: Spusť build**

Run: `cd ~/czechsubaruclub && pnpm build 2>&1 | tail -10`
Expected: build success.

- [ ] **Step 3: Final audit**

Run: `cd ~/czechsubaruclub && pnpm audit 2>&1 | tail -20`

Zaznamenej stav (počet modelů s image / bez image / errors). Tohle bude baseline pro Phase 2.2.

- [ ] **Step 4: Final git log review**

Run: `cd ~/czechsubaruclub && git log --oneline | head -15`
Expected: 9 (Phase 0+1) + 6-8 (Phase 2.1) = cca 15-17 commitů.

---

### Task 10: Memory update + handoff k Phase 2.2

**Files:**
- Modify: `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md`
- Modify: `~/.claude/projects/-Users-matejsamec-Downloads/memory/MEMORY.md`

- [ ] **Step 1: Update project memory**

Edit `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md` — replace "Stav 2026-05-16" sekci s novou (datum = aktuální datum dokončení):

```markdown
## Stav YYYY-MM-DD (Phase 2.1 DONE)

**Phase 2.1 SHIPPED.** Wikidata pipeline live. Cca 15-17 commitů total v repo.

**Pipeline library**: `lib/pipeline/fetch.ts` (throttle 1 req/s + UA + retry 3x) + `lib/pipeline/wikidata.ts` (entity parse + P18 image + P571 inception extractors) + `lib/pipeline/types.ts`.

**Scripts**: `scripts/research/enrich-models-wikidata.ts` (dry-run + apply, --only=<slug> filter) + `scripts/research/audit.ts` (tier distribution + completeness).

**DB stav**:
- 27 models, tier=bronze
- hero_image_url: X/27 vyplněno z Wikidata P18 (X = skutečné číslo z audit logu)
- description_en_raw: 0/27 (Phase 2.2)
- production_start: 27/27 z curated seed, NEoverwritten Wikidata claims

**Audit baseline** uchováno pro porovnání po Phase 2.2.

**Další krok**: writing-plans pro Phase 2.2 = Wikipedia infobox parser (Parsoid HTML + cheerio + 4 fallback strategies) pro description_en_raw + production_end + heroImageUrl pro modely co P18 chybělo.
```

- [ ] **Step 2: Update MEMORY.md index**

Edit `~/.claude/projects/-Users-matejsamec-Downloads/memory/MEMORY.md` — najdi czechsubaruclub řádek a updatuj na:
```markdown
- [CzechSubaruClub.cz](project_czechsubaruclub.md) — encyklopedie všech Subaru, **Phase 2.1 SHIPPED YYYY-MM-DD**: Wikidata pipeline live, X/27 modelů s hero_image_url (lib/pipeline/{fetch,wikidata,types} + enrich-models-wikidata + audit scripts). 18+ unit tests green. Phase 2.2 Wikipedia infobox parser čeká.
```

- [ ] **Step 3: Memory files jsou auto-saved, žádný commit**

Memory files nejsou v git repu.

---

## Self-Review checklist (po dokončení 10 tasků)

- [ ] Tests: 18+ passed v `pnpm test`
- [ ] Build: `pnpm build` zelený
- [ ] Audit: `pnpm audit` ukazuje hero_image_url > 50% modelů vyplněno
- [ ] DB hits: žádné nepřípustné zápisy do `public` schema (vše v `subaruclub`)
- [ ] Memory updated
- [ ] Vercel auto-deploy z `main` proběhl (`vercel ls --yes`)

---

## Pokud něco selže

**Wikidata API throttle/429** — náš throttle je 1 req/s, Wikidata povoluje 5 req/s pro authenticated. Pokud dostaneme 429 i s naším throttlem, něco je špatně s p-throttle inicializací. Debug: `console.log` v `throttledRaw` před každým fetch.

**P18 image URL 404** — Commons URL pattern je `commons/<md5[0]>/<md5[0..2]>/<filename>`. Pokud 404, ověř že MD5 je počítáno z `filename.replace(/ /g, '_')` (ne raw filename). Test s `wikidata.test.ts buildCommonsImageUrl`.

**Drizzle connection error** — DATABASE_URL je špatně formatovaný. Special chars v hesle musí být `encodeURIComponent`. Příklad: `@` → `%40`, `#` → `%23`.

**Test flake na throttle** — `vi.useFakeTimers()` ne vždy klade `setTimeout` v p-throttle. Pokud test nestabilní, mock `pThrottle` přímo:
```ts
vi.mock("p-throttle", () => ({
  default: () => (fn: () => unknown) => () => Promise.resolve(fn()),
}));
```

**Wikidata fixture outdated** — pokud Wikidata vrátí jiný shape (přidají claim, refactor), test failne. Regeneruj fixture: `curl -sH "User-Agent: ..." https://www.wikidata.org/wiki/Special:EntityData/Q834945.json > tests/.../fixtures/...`. Pak rerun test, pokud assertions failují, updatuj očekávané hodnoty.

**`pnpm tsx -e` queries v Task 6/7** používají inline import — pokud failují s `Cannot find module @/lib/db`, alternativně použij přímo soubor:
```bash
echo "import { db, schema } from './lib/db'; (async () => { ... })()" > /tmp/check.ts
pnpm tsx /tmp/check.ts
```
