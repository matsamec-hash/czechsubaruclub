# CzechSubaruClub — Roadmap

**Aktuální stav** (2026-05-20): web LIVE na `https://czechsubaruclub.cz`, 40 routes, GSC verified, GA4 (G-N4298CK6JF) gated by consent, 27 modelů s hero fotkami a Wikipedia summary.

Hotové fáze viz `docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md` + commit log v `main`.

---

## Phase 2.3 — Generations (next)

**Cíl**: každý ze 27 modelů má minimálně 1 generation row v DB s vlastní detail stránkou `/modely/[slug]/[generace]`.

**Scope**:
- Wikipedia infobox parser (Parsoid HTML + cheerio) — reuse pattern z `feedback_wikipedia_infobox_parser`
- Parsuje "Generations" sekci EN Wiki článku
- Extract: `year_start`, `year_end`, `code` (chassis: GD, GH, GJ), `name`, `description_en_raw`
- Cíl: 30-50 generations celkem napříč 27 modely
- Bonus: P3300 chassis codes z Wikidata
- Render `/modely/[slug]/[generace]` stránka (podobná model detail page)

**Soubory**:
- `scripts/research/enrich-generations.ts` (nový)
- `lib/pipeline/wikipedia.ts` (rozšířit o `fetchWikipediaInfobox`)
- `app/modely/[slug]/[generace]/page.tsx` (nový)
- Sitemap update — `app/sitemap.ts` doplnit generation routes

**Riziko**: některé modely nemají generations sekci v EN Wiki (kei JDM rarity), pak zůstanou bez generation = render fallback v parent detail page.

**Odhad**: 4-6h práce (pipeline + render + test).

---

## Phase 5 — CZ overlay (gold tier)

**Cíl**: 12 hero modelů (Impreza, WRX, WRX STI, Forester, Outback, Legacy, BRZ, Levorg, XV, SVX, Justy, Tribeca) mít content_tier='gold' s plnou českou redakcí.

**Scope**:
- Ručně psaný `tagline_cs` (1 věta, CZ kontext)
- Ručně psaný `description_cs` (3-5 odstavců — co je model, kdy se prodával v CZ, motorizace v EU specu, rally heritage, sběratelská hodnota)
- Promote `content_tier` na `gold`
- SQL migration `migrations/0010_cz_overlay_hero.sql` (pattern ze spec sekce 6.4)
- Audit po: 12 gold + 15 bronze = 100% kompletní u hero modelů

**Riziko**: psaní textu = 30-40 hodin manuální práce. Alternativa: AI-generated CZ summary + manuální review (rychleji ale Helpful Content algoritmus penalizace).

**Odhad**: 30-40h ruční psaní, NEBO 4-6h AI-assisted + review.

---

## Phase 4/6 — Komunita + Diskuze (UGC)

Aktuálně **mockup-only**. Reálná implementace vyžaduje:

**Auth**:
- Supabase Auth (email/Google sign-in)
- `subaruclub.users` tabulka (nebo využít Supabase auth.users + profile row)
- RLS policies pro user-owned data

**Pochlub se** (`/komunita`):
- Tabulka `subaruclub.user_cars` (user_id, model_id, photos[], story_cs, location, created_at)
- Upload fotek do Supabase Storage bucketu `user-photos`
- Moderation queue (anti-spam)
- Public profile per user

**Diskuze** (`/diskuze`):
- Tabulky: `subaruclub.threads`, `subaruclub.posts`
- 4 kategorie (Údržba/Tuning/JDM/Rally) — enum
- Markdown rendering pro posts (rehype + sanitize)
- Vote/like system (Phase 7)
- Notifications na repliky (email + in-app)

**Riziko**: spam abuse, content moderation overhead, UI komplexita.

**Odhad**: 30-50h (auth + upload + moderation + UI). Nutné rozdělit na sub-fáze.

---

## Phase 7 — Monetizace (AdSense)

**Předpoklad**: 4-8 týdnů indexace v Google + 100+ stránek s reálným contentem (po Phase 2.3 generations + Phase 5 CZ overlay).

**Scope**:
- AdSense account approval (vyžaduje significant content, GDPR cookies banner — máme)
- 3 ad slot layout: `header-banner`, `mid-content`, `sidebar`
- `AdSlot.tsx` lazy mount via IntersectionObserver (CLS prevention)
- `app/ads.txt/route.ts` server response s pub-id
- CMP update — přidat reklamní kategorii cookies
- Affiliate strip: `AffiliateStrip.tsx` (Sauto, TipCars, Aukro) — již máme v detail stránce

**Migrace**: AdSense → Ezoic při ≥10k MV/měsíc (Phase 7.5).

**Odhad**: 6-10h kód + 2-4 týdny čekání na approval.

---

## Quick wins (kdykoliv mezi fázemi)

- **Vypnout Vercel Deployment Protection** — lepší SEO crawler reach (Settings → Deployment Protection → Disabled)
- **Dotáhnout CS Wikipedia summary** — 17 modelů má jen EN; manuální search alternativní CS sources (idnes.cz, autoblog.cz, motohouse.cz)
- **Hero polish** — A/B test různých video clipů, statický fallback pro mobile (data saver)
- **OG image varianty** — per-model OG image generation (edge route s model slug param)
- **Cloudflare migration** — per memory `project_cloudflare_migration`, Phase 2 czechsubaruclub čeká

---

## Pending user akce

- ✅ DNS migrace na Vercel — DONE (2026-05-17)
- ✅ Reset DB password — DONE (2026-05-17)
- ✅ GA4 setup + sync do Vercel — DONE (2026-05-17, G-N4298CK6JF)
- ✅ GSC verification — DONE (2026-05-20)
- ⏳ GSC sitemap submit — user task: GSC → Sitemaps → vlož `sitemap.xml`
- ⏳ URL indexing requests pro 5-10 hero modelů (Impreza, WRX STI, BRZ, Forester, Outback…)
- ⏳ Vercel Deployment Protection vypnout (volitelné)
- ⏳ Cloudflare migration Fáze 2 (volitelné per `project_cloudflare_migration`)
