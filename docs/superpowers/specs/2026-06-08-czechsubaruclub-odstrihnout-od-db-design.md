# Design: czechsubaruclub — odstřižení od sdílené DB (eliminace DB úplně)

**Datum:** 2026-06-08
**Vstupní brief:** `2026-06-08-odstrihnout-od-sdilene-db-zadani.md`
**Stav:** schváleno (brainstorm) → plán → exekuce

## Cíl

czechsubaruclub.cz dnes čte svá data ze sdíleného Supabase projektu
`obhypfuzmknvmknskdwh` (schéma `subaruclub`) **při buildu**. Cílem je web
**úplně odstřihnout od jakékoli DB**: data vypéct do repa jako JSON a build
přepnout na lokální čtení. Tím se `obhypfuzmknvmknskdwh` stane single-tenant
(jen agro-svet) a budoucí migrace agro-svetí DB bude čistá.

## Klíčové zjištění reconu (zpřesňuje brief)

- **Appka i enrichment se dotýkají JEN tabulky `models`.** Všech 47 referencí
  na schéma v `app/` je `schema.models`. Tabulky `generations`, `trims`,
  `media`, `cz-context` existují ve schématu, ale **nikdo je nečte ani
  nezapisuje** — ani build, ani enrichment skripty.
- Reálný dataset = **jedna plochá tabulka, ~desítky řádků, žádné joiny.**
- Dotazy konzumentů jsou triviální: „všechny modely seřazené dle slug"
  (různé podmnožiny sloupců) a „jeden model dle slug".
- Enrichment je field-merge per řádek; **žádné joiny** → varianta s dočasnou
  DB (brief Option b) je zbytečná. Volíme **variantu (a): skripty píšou rovnou
  do JSON.**
- ⚠️ Ruční pole (`taglineCs`, gold `descriptionCs` overlay řízený
  `content_tier`) se dnes editují přímo v DB přes Studio → nejdou
  regenerovat z pipeline → **musí je zachytit jednorázový export živé DB.**

## Architektura

```
PŘED:  Supabase obhypfuzmknvmknskdwh (schéma subaruclub)
         │ build-time drizzle dotazy (inline v 7 souborech)
         ▼
       next build → out/ → Hostinger

PO:    data/models.json   (commitnuto = source of truth)
         │ lib/data/models.ts  (JSON loader + helpery)
         ▼
       next build → out/ → Hostinger
       (žádný DATABASE_URL, žádné drizzle/postgres v buildu)
```

### Jednotky

1. **`data/models.json`** — vyexportovaný obsah živé `subaruclub.models`
   (zachytí i ruční pole). Pro archiv se vyexportují i ostatní 4 tabulky do
   `data/<table>.json`, i kdyby byly prázdné (laciná pojistka — celé schéma
   v repu). **App čte jen `models.json`.**
2. **`lib/data/models.ts`** — tenká čtecí vrstva: `listModels()`,
   `getModel(slug)` + plain TS typ `Model` (nahradí drizzle `$inferSelect`).
3. **Enrichment skripty** — přepsané na čtení/zápis JSON (varianta a).

## Datový model

Typ `Model` (plain TS, odvozený z dnešní `subaruclub.models`):

```ts
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
  contentTier: string;        // "bronze" | "silver" | "gold"
  createdAt: string;          // ISO string (v DB timestamptz)
  updatedAt: string;          // ISO string
};
```

## Komponenty

### 1. Export živé DB (jednorázový) — `scripts/export-db-to-json.ts`

- Připojí se přes `DATABASE_URL` z `.env.local` **syrovým `postgres`
  klientem** (raw SQL `select * from subaruclub.<table>`), bez drizzle — ať
  export nezávisí na ORM, který hned poté dropujeme.
- Zapíše každou tabulku s řádky do `data/<table>.json`, **deterministicky
  seřazené** (models dle `slug`) → stabilní diff.
- Vypíše počty řádků per tabulka (akceptační kontrola kroku).
- Creds čte výhradně z env, nikam je nezapisuje.
- Skript zůstane v repu jako doložení postupu (po dropnutí `postgres`
  dependency už nebude spustitelný — zdokumentováno v hlavičce skriptu).

### 2. Čtecí vrstva — `lib/data/models.ts`

```ts
import modelsJson from "@/data/models.json";

const models = modelsJson as Model[];

export function listModels(): Model[] {
  return [...models].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

export function getModel(slug: string): Model | null {
  return models.find((m) => m.slug === slug) ?? null;
}
```

**Shoda tvaru dat (kritické pro build-parity):**
- Helpery vrací **stejné typy/tvar**, jaké dnes komponenty očekávají od
  drizzle (`productionStart: number|null` atd.).
- Řazení dle `slug` **prostým porovnáním kódů znaků** (`a.slug < b.slug`),
  NE `localeCompare` — odpovídá Postgres `ORDER BY text` (bytové/`C`
  collation). Ověřit proti reálnému výstupu (pořadí ovlivňuje prev/next
  a sitemap).
- `updatedAt` se reálně používá jen v `sitemap.ts` (`lastModified`). JSON
  loader vrátí hodnotu tak, aby sitemap výstup byl identický (dle potřeby
  `new Date(m.updatedAt)`).

### 3. Konzumenti (7 souborů) — přepojit inline drizzle → helpery

| Soubor | Dnešní dotaz | Po |
| --- | --- | --- |
| `app/modely/[slug]/page.tsx` | `fetchModel`, `fetchSiblings`, `generateStaticParams` | `getModel`, `listModels` |
| `app/modely/page.tsx` | select subset, order slug | `listModels` |
| `app/page.tsx` | select subset, order slug | `listModels` |
| `app/sitemap.ts` | select slug+updatedAt | `listModels` |
| `app/llms.txt/route.ts` | select subset, order slug | `listModels` |
| `app/kviz/.../vysledek/[slug]/page.tsx` | select by slug | `getModel` |
| `app/kviz/.../vysledek/[slug]/opengraph-image.tsx` | select name by slug | `getModel` |

Projít jeden po druhém; zachovat existující `try/catch`→fallback chování
tam, kde má smysl (nebo zjednodušit — JSON čtení neselhává jako síťový dotaz).

### 4. Enrichment skripty (varianta a) — JSON in/out

- **`seed-models.ts`** — místo upsertu do DB merguje
  `seed-data/subaru-models.json` do `data/models.json` (upsert dle `slug`,
  zachová ruční pole u existujících řádků).
- **`enrich-models-wikidata.ts`** — čte `data/models.json`, fetchne Wikidata,
  mergne `heroImageUrl`, zapíše JSON. Zachová `--dry-run`/`--only`.
- **`enrich-models-wikipedia.ts`** — čte `data/models.json`, fetchne
  Wikipedia summaries, mergne `descriptionCs`/`descriptionEnRaw`, zapíše JSON.
  Zachová `--dry-run`/`--only`/`--overwrite`.
- **`audit.ts`** — přepsat na čtení JSON (jen reportuje).
- `lib/pipeline/*` (fetch/wikidata/wikipedia/types) = čisté fetch helpery,
  **beze změny.**
- Ruční editace polí (tagline, gold overlay) nově = přímá editace
  `data/models.json` (verzované, reviewable — lepší než neviditelné Studio
  editace).
- Zápis JSON: stejné deterministické řazení a formátování jako export →
  čisté diffy.

### 5. Úklid

- Smazat `lib/db/` celé (index + schema/*).
- Drop dependencies: `drizzle-orm`, `postgres`, `drizzle-kit`.
- Smazat `drizzle/` (migrace) + `drizzle.config.ts`.
- Odebrat `DATABASE_URL` + `NEXT_PUBLIC_SUPABASE_URL` z `.env.local`,
  `.env.local.example` a z `lib/env.ts`.
- Odebrat `db:generate`/`db:migrate`/`db:push`/`db:studio` z `package.json`.
- Aktualizovat `CLAUDE.md` + `AGENTS.md` (DB konvence → JSON konvence).

## Testování (TDD kde dává smysl)

- `lib/data/models.ts`: `getModel` vrací správný řádek / `null` pro neznámý
  slug; `listModels` vrací všechny ve stejném pořadí jako DB; tvar objektu
  odpovídá tomu, co komponenty čtou.
- Enrichment skripty: merge logika (dry-run neměnní JSON; `--overwrite`
  přepíše; bez něj zachová existující) — unit testy nad in-memory daty.
- **Build-parity (akceptační):** zachytit `out/` před změnou, po změně
  `next build`, diffnout statický výstup. Cíl = ověřeně shodný `out/`
  (povolené jen vysvětlitelné rozdíly, ideálně žádné).

## Sekvence exekuce

1. **Export** `subaruclub` → `data/*.json` (potřebuje `postgres`+`DATABASE_URL`).
   Ověřit počty řádků.
2. **Čtecí vrstva** `lib/data/models.ts` + testy.
3. **Přepojit 7 konzumentů** → helpery.
4. **Build-parity** — porovnat `out/` (s ještě přítomnými deps).
5. **Enrichment** skripty → JSON in/out + testy + docs.
6. **Úklid** — drop `lib/db/`, deps, drizzle, env vars, db:* skripty, docs.
7. **Finální build + parity + deploy** `scripts/deploy.sh` (beze změny).
8. **Verifikace live** — czechsubaruclub.cz po deployi identický (modely,
   kvíz, sitemap, OG). agro-svet netknutý.

## Rizika

- **Inline dotazy roztroušené v 7 souborech** — projít systematicky, ať
  výstup sedí 1:1 (řazení, typy, serializace dat).
- **OG image generation** (`opengraph-image.tsx`) čte z DB při buildu → musí
  jet z JSON taky.
- **Žádný MCP na `obhypfuzmknvmknskdwh`** → export přes `DATABASE_URL`
  z `.env.local`. Creds nemíchat do kontextu.
- **NEdotýkat se agro-svetích `public` tabulek** — týká se JEN schématu
  `subaruclub`. Po odstřižení lze `subaruclub` schéma v cloudu nechat/
  zazálohovat; smazat až po ověření.
- Repo žije. Feature práce **ve worktree**, NIKDY `git add -A`.

## Definition of Done

czechsubaruclub buildí a deployuje bez jakékoli DB (žádný `DATABASE_URL`);
live web identický; data v repu (JSON) jako source of truth; enrichment
workflow funkční (varianta a); `obhypfuzmknvmknskdwh` už czechsubaruclub
neobsluhuje → připraveno na single-tenant migraci agro-svet DB.
