# ZADÁNÍ pro další okno — czechsubaruclub: odstřihnout od sdílené DB (eliminovat DB úplně)

**Datum:** 2026-06-08
**Typ:** příprava před migrací agro-svet DB. **NEJDŘÍV brainstorm → spec → exekuce.** NEskákat do kódu.
**Spustit:** „Pojďme odstřihnout czechsubaruclub od sdílené DB — viz zadání 2026-06-08." Načti tento soubor + (kontext) paměť `project-migrace-weby-vps-hostinger` a `project-agro-svet-vps-migrace`.

---

## 0. Cíl v jedné větě
czechsubaruclub.cz teď čte svá data ze **sdíleného Supabase projektu `obhypfuzmknvmknskdwh`** (schéma `subaruclub`) **při buildu**. Chceme ho **úplně odstřihnout od jakékoli DB** — data **vypéct do repa (JSON)** a build přepnout na lokální čtení. Tím se `obhypfuzmknvmknskdwh` stane **single-tenant (jen agro-svet)** a budoucí migrace agro-svetí DB bude čistá.

## 1. Proč (kontext)
- agro-svet hosting se 2026-06-08 zmigroval CF Workers → VPS, ale **DB zůstala cloud `obhypfuzmknvmknskdwh`**, kterou **sdílí právě s czechsubaruclubem**. Sdílení = největší riziko příští DB migrace.
- czechsubaruclub je ale **statický web** (Next `output: "export"`, deploy `out/` na Hostinger) → runtime DB nevyužívá vůbec. DB čte JEN při buildu. Proto je **nízkorizikový kandidát na úplné odstřižení.**
- Doporučená sekvence: **odstřihnout czechsubaruclub PRVNÍ → pak migrovat agro-svet DB** jako jednoho nájemníka.

## 2. RECON (ověřeno 2026-06-08, NEsahat než si to potvrdíš)
- **Izolovaná data:** `lib/db/schema/_namespace.ts` → `export const subaruclub = pgSchema("subaruclub")`. Tabulky: `models`, `generations`, `trims`, `media`, `cz-context` (`lib/db/schema/*.ts`). Vlastní schéma, žádné prolnutí s agro-svetím `public`.
- **DB klient:** `lib/db/index.ts` = drizzle-orm + postgres-js, čte `env.DATABASE_URL` (pooler `aws-0-eu-west-1.pooler.supabase.com` projektu `obhypfuzmknvmknskdwh`). `NEXT_PUBLIC_SUPABASE_URL=https://obhypfuzmknvmknskdwh.supabase.co`. **Žádná `@supabase` dependency** (jen drizzle+postgres).
- **App jen ČTE při buildu** — server komponenty importují `{ db, schema }` a volají drizzle dotazy inline (např. `app/modely/[slug]/page.tsx`: `fetchModel(slug)`, `fetchSiblings(slug)`; dál `app/modely/page.tsx`, `app/page.tsx`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/kviz/.../opengraph-image.tsx` + `page.tsx`). **⚠️ dotazy jsou inline v komponentách, ne v centrální query vrstvě** → spočítat všechna místa.
- **Do DB píšou JEN občasné enrichment skripty** (ruční): `npm run seed:models`, `enrich:models:wikidata`, `enrich:models:wikipedia` (+ `audit:content`, `preview:models`). `lib/pipeline/wikidata.ts`. Žádný zápis z appky.
- **Statický runtime:** `next.config` `output: "export"`, deploy `bash scripts/deploy.sh` → `out/` na Hostinger (92.113.x). Live web: login/člen/fórum stránky 404, žádný supabase v JS. Runtime DB = 0.
- **Zatím žádný snapshot dat v repu** (žádné `data/*.json` ani sqlite).
- Velikost dat = malá (encyklopedie Subaru modelů — desítky modelů, stovky generací/trims). Vejde se do JSON bez problému. **POZOR: nemám MCP přístup na `obhypfuzmknvmknskdwh`** → export dat musí proběhnout přes `DATABASE_URL` z `.env.local` (Drizzle/`postgres` skript) nebo přes Studio.

## 3. Doporučený přístup (vyřešit v brainstormu)
**Option A — vypéct do JSON + tenká in-memory čtecí vrstva (DOPORUČENO, nulová DB).**
- Vyexportovat `subaruclub` schéma → JSON do repa (`data/` nebo `src/data/`), jeden zdroj pravdy.
- Nahradit inline drizzle dotazy lokálními helpery (`getModel(slug)`, `listModels()`, `getSiblings(slug)`, …) čtoucími JSON.
- **Drop `drizzle-orm`+`postgres` z runtime/buildu** appky (zůstanou jen pro enrichment skripty, viz níže).
- Vyhodit `DATABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` z `.env` appky.

**Otázka pro brainstorm — co s enrichment workflow:**
- (a) Enrichment skripty přepsat tak, aby zapisovaly přímo do JSON (žádná DB vůbec, ani pro enrichment), nebo
- (b) Nechat enrichment proti lokální/dočasné DB (PGlite/lokální Postgres) → po enrichmentu **export do JSON** → commit. „Source of truth" = commitnutý JSON, DB jen dev-nástroj pro enrichment.
- Doporučení: **(b)** pokud je enrichment složitý (Wikidata/Wikipedia joins), jinak (a). Rozhodnout dle složitosti `lib/pipeline/wikidata.ts`.

**Alternativa Option B (NEdoporučeno):** dát czechsubaruclubu vlastní self-host Supabase. Zbytečná infra, když data jen čte při buildu.

## 4. Kroky exekuce (po brainstormu→spec)
1. **Export** `subaruclub` schématu → JSON (skript přes stávající `DATABASE_URL`; commitnout výstup). Ověřit kompletnost (počty řádků per tabulka).
2. **Čtecí vrstva** — nový `lib/data/*` (JSON loader + helpery se stejným tvarem dat jako dnešní drizzle výstup). TDD: testy že helpery vrací totéž co dřív.
3. **Přepojit konzumenty** — všechna inline `db.*` místa (§2) → helpery. Spočítat a projít jeden po druhém.
4. **Enrichment** — dle rozhodnutí (a)/(b); aktualizovat `package.json` skripty + docs.
5. **Vyčistit** — drop `DATABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` z `.env*`, drop drizzle/postgres z app dependencies (zůstanou jen pokud (b)), `drizzle.config` jen pro enrichment.
6. **Build parity** — `next build` musí dát **bajt-identický** (nebo ověřeně shodný) `out/` jako před změnou. Diff statického výstupu. Deploy `scripts/deploy.sh` beze změny.
7. **Verifikace** — live czechsubaruclub.cz po deployi beze změny (modely, kvíz, sitemap, OG). agro-svet netknutý.

## 5. Rizika / pozor
- **Inline dotazy roztroušené v komponentách** — víc dotčených souborů, projít systematicky (TDD), ať build výstup sedí 1:1.
- **OG image generation** (`opengraph-image.tsx`) čte data z DB při buildu → musí jet z JSON taky.
- **Žádný MCP na `obhypfuzmknvmknskdwh`** → export přes `DATABASE_URL` (z `czechsubaruclub/.env.local`) nebo Studio. Creds nemíchat do kontextu.
- **NEdotýkat se agro-svetích `public` tabulek** — odstřižení se týká JEN `subaruclub` schématu. Po odstřižení lze `subaruclub` schéma v cloudu klidně nechat/zazálohovat; smazat až po ověření.
- Repo žije (poslední commit 2026-06-04). Feature práce ve worktree, NIKDY `git add -A`.

## 6. Definition of Done
czechsubaruclub buildí a deployuje **bez jakékoli DB** (žádný `DATABASE_URL`); live web identický; data v repu (JSON) jako source of truth; enrichment workflow funkční dle zvolené varianty; `obhypfuzmknvmknskdwh` už czechsubaruclub neobsluhuje → připraveno na single-tenant migraci agro-svet DB.
