@AGENTS.md

# CzechSubaruClub konvence

## Jazyk

Komunikace **česky**. Commit messages, code comments a docs anglicky.

## Stack & vzory

- Next.js 16 App Router, žádný `src/` directory
- Tailwind v4 + CSS `@plugin` directive (NE `tailwind.config.js` plugins)
- Data: `data/models.json` (source of truth), čteno přes `lib/data/models.ts`. ŽÁDNÁ DB.
- Tests Vitest, unit jen (`tests/unit/`); E2E přijdou v Phase 3
- Components v `app/(components)/` nebo `app/<route>/(components)/`
- TDD pro pipeline scripty (`scripts/research/`), NE pro UI

## Bezpečnost

- Nikdy nepushuj `.env.local`
- Wikipedia pipeline throttle 1 req/s + User-Agent header

## Data konvence

- Source of truth = `data/models.json` (commitnuto). App ho čte přes `lib/data/models.ts` (`listModels`/`getModel`).
- Enrichment skripty (`scripts/research/*`) čtou/píšou `data/models.json` přes `lib/data/models-file.ts`.
- Ruční editace polí (tagline, gold overlay přes `content_tier`) = přímá editace `data/models.json`.
- Fotky modelů jsou self-hostované v `public/fotky/*.webp` (`heroImageUrl` = `/fotky/<slug>.webp`) — nikdy hotlink na `upload.wikimedia.org` (cizí server vidí IP před souhlasem; hlídá `tests/unit/photo-credits.test.ts`). Nové/změněné URL z `enrich:models:wikidata` po něm převést `pnpm localize:model-photos` (stáhne, převede na WebP max 1600 px, přepíše `heroImageUrl`; potřebuje ImageMagick). Autor, licence a zdroj zůstávají v `heroImageCredit/-License/-Source`.
- `content_tier`: `bronze` (jen pipeline) | `silver` (+ CZ tagline) | `gold` (+ plný CZ overlay).
- Statický web (`output: export`) — žádná DB při buildu ani runtime. `scripts/export-db-to-json.ts` = jednorázový historický export (vyžadoval `postgres`+`DATABASE_URL`).

## Memory reference

User memory: `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md`
