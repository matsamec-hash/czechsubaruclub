@AGENTS.md

# CzechSubaruClub konvence

## Jazyk

Komunikace **česky**. Commit messages, code comments a docs anglicky.

## Stack & vzory

- Next.js 16 App Router, žádný `src/` directory
- Tailwind v4 + CSS `@plugin` directive (NE `tailwind.config.js` plugins)
- Drizzle ORM v `subaruclub` Postgres schema (sdílíme content-network DB `obhypfuzmknvmknskdwh`)
- Schema soubory v `lib/db/schema/<table>.ts`, namespace v `lib/db/schema/_namespace.ts`
- Tests Vitest, unit jen (`tests/unit/`); E2E přijdou v Phase 3
- Components v `app/(components)/` nebo `app/<route>/(components)/`
- TDD pro pipeline scripty (`scripts/research/`), NE pro UI

## Bezpečnost

- Nikdy nepushuj `.env.local`
- Vercel env vars sync přes `vercel env add`
- Wikipedia pipeline throttle 1 req/s + User-Agent header

## DB konvence

- Všechny tabulky v `subaruclub` schema, NE v `public`
- Public schema patří content-network CMS — nesahej
- FK constraints používáme přes Drizzle `references(() => ..., { onDelete: 'cascade' })`
- `content_tier` enum: `bronze` (jen pipeline data) | `silver` (+ CZ tagline) | `gold` (+ plný CZ overlay)

## Memory reference

User memory: `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md`
