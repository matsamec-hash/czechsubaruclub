# CzechSubaruClub.cz

Encyklopedie všech Subaru modelů v češtině. Next.js 16 + Supabase + Drizzle ORM.

## Status

Phase 0+1 (Foundation) — scaffold + DB schema + curated whitelist 28 modelů.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind v4 + Chakra Petch font (Midnight Garage palette)
- **DB**: Supabase Postgres (sdílí content-network DB v `subaruclub` schema)
- **ORM**: Drizzle
- **Deploy**: Vercel (auto z `main`)
- **Tests**: Vitest

## Dev

```bash
nvm use
pnpm install
cp .env.local.example .env.local  # vyplň reálné hodnoty
pnpm dev
```

## DB

```bash
pnpm db:generate    # vygeneruj migraci ze schema změn
pnpm db:migrate     # aplikuj migrace
pnpm db:push        # push schema diff bez migration souboru
pnpm db:studio      # otevři Drizzle Studio
pnpm seed:models    # naseed-uj curated whitelist
```

## Tests

```bash
pnpm test           # spusť všechny testy
pnpm test:watch     # watch mode
```

## Roadmap

Viz `docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md`.

## Provoz

Samec Digital s.r.o. (IČO 29547539) · info@samecdigital.com
