# czechsubaruclub.cz — Encyklopedie všech Subaru (Design Spec)

**Datum:** 2026-05-16
**Status:** Schválený design, čeká na writing-plans → implementaci
**Doména:** czechsubaruclub.cz
**Stav domény:** stovky users/měsíc přes 301 redirect z `/subaru` sekce jiného webu; **nic se nemigruje, čistý stůl**

---

## 1. Vize

Encyklopedický web všech modelů Subaru (CZ jazyk), monetizace přes display reklamu a affiliate odkazy na bazary. Cílová audience: čeští Subaru nadšenci hledající strukturovaná data o modelech, generacích a motorizacích. **Žádné UGC**, žádný magazín. "Klub" zůstává v názvu jako brand, ne jako funkce.

## 2. Vizuální identita — Midnight Garage

- Tmavé UI: pozadí `bg-[#050810]` global, hero `radial-gradient(ellipse at top, #0a1428 0%, #050810 70%)`
- Accent barvy: Subaru blue `#4A8DFF` (linky, CTA), amber `#FFB800` (highlights, badge typu "STI")
- Glass karty: `bg-white/[0.03] backdrop-blur-[40px] ring-1 ring-white/[0.06]`
- Font: Chakra Petch (latin + latin-ext), system-ui fallback, preload `/fonts/chakra-petch-700.woff2`
- Vibe: tech encyklopedie, garáž v noci, data-first
- Mockup reference: `~/czechsubaruclub-brainstorm/.superpowers/brainstorm/51575-1778021648/content/visual-direction.html` direction A

## 3. Architektura a stack

- **Framework**: Next.js 16 App Router + TypeScript, ISG/SSG-first
- **DB**: Supabase (nový projekt; ne přesouvat do shared Pro, dokud user nepotvrdí konsolidaci per `project_vps_migration_consideration.md`)
- **ORM**: Drizzle (typed queries)
- **Storage**: Supabase Storage bucket `media` pro fotky + render transformer (NE Vercel Image, kvůli kvótě)
- **Deploy**: Vercel Hobby (auto-deploy z `main`); upgrade na Pro při růstu
- **Repo**: `matsamec-hash/czechsubaruclub` (public, jako svetovestadiony)

**Render strategie:**

| Route | Render | Revalidate |
|---|---|---|
| `/` | SSG | 1h |
| `/modely` | SSG | 1h |
| `/modely/[slug]` | SSG | 24h |
| `/modely/[slug]/[generace]` | SSG | 24h |

## 4. URL struktura

```
/                              homepage (12 hero modelů + indexy)
/modely                        kompletní katalog s filtrováním
/modely/[slug]                 model overview + generations grid
/modely/[slug]/[generace]      full detail page s trims tabulkou
```

Příklady: `/modely/impreza`, `/modely/impreza/gj-2011-2016`, `/modely/wrx-sti`.

Generační slugy používají Subaru chassis kódy (GJ, GH, GK) — to co fanoušci hledají.

**301 redirect mapping** legacy `/subaru/*` → `/modely/*` — vytvoříme post-launch, jakmile známe top legacy URLs z GSC.

## 5. Datový model

```sql
-- models
id uuid PK
slug text UNIQUE                   -- impreza, wrx-sti, forester
name text                          -- "Impreza"
name_full text                     -- "Subaru Impreza"
tagline_cs text                    -- CZ jednovětý sumář
description_cs text                -- 1-3 odstavce CZ kontextu (ručně)
description_en_raw text            -- Wiki dump (zdroj, ne pro render)
category text                      -- sedan|hatchback|suv|wagon|coupe|jdm
production_start int
production_end int|null
hero_image_url text
wikidata_qid text
content_tier text                  -- bronze|silver|gold
created_at, updated_at

-- generations
id uuid PK
model_id FK
slug text                          -- "gj-2011-2016"
code text                          -- "GJ", "GH", "GD"
name text                          -- "čtvrtá generace"
year_start int
year_end int|null
description_cs text
description_en_raw text
hero_image_url text
chassis_codes text[]               -- ["GJ", "GP"]
created_at, updated_at
UNIQUE(model_id, slug)

-- trims
id uuid PK
generation_id FK
name text                          -- "WRX STI", "2.0i Sport"
engine_code text                   -- "EJ257"
engine_displacement_cc int
power_hp int
torque_nm int
drivetrain text                    -- AWD|FWD|RWD
transmission text                  -- 6MT|CVT|4AT
top_speed_kmh int
zero_to_100_s numeric
created_at, updated_at

-- media
id uuid PK
entity_type text                   -- model|generation
entity_id uuid
url text
alt_cs text
credit text                        -- "Wikimedia Commons / autor"
sort_order int
created_at

-- cz_context (Phase 2)
id uuid PK
model_id FK|null
generation_id FK|null
topic text                         -- rally|ceny-cz|import-jdm|affiliate-overrides
content_cs text
created_at, updated_at
```

**Klíčové volby:**
- `description_en_raw` = zdrojový text z Wikipedie, nikdy se nerendruje uživateli (jen reference + fallback dokud nenapíšeš CZ overlay)
- `content_tier` (bronze/silver/gold) = stadium-tier pattern ze svetovestadiony; bronze = jen pipeline data, silver = + CZ tagline, gold = + plný CZ overlay 3+ odstavce
- `trims` se naplní z Wikipedia infoboxu, ale je opt-in
- `cz_context` je oddělená tabulka pro tematické bloky (rally heritage, CZ ceny, import JDM); odložené do Phase 2

## 6. Pipeline a content ingest

### 6.1 Seed fáze
`scripts/research/seed-models.ts` — curated whitelist (~25-30 modelů vč. JDM Alcyone, Vivio, R1, R2, Stella) s mapováním `{slug, name, wikipedia_en_title, wikidata_qid, category}`. Důvod: curated > heuristics (`feedback_wikidata_curation.md`).

### 6.2 Pipeline scripty (sequenční)

```
scripts/research/
├── seed-models.ts              — curated whitelist do `models`
├── enrich-models-wikidata.ts   — P18 image, P571 inception, P3300 chassis codes
├── enrich-models-wikipedia.ts  — Parsoid HTML + cheerio, parsuje hlavní infobox
├── enrich-generations.ts       — parsuje "Generations" sekci Wiki + Wikidata items Q3231690
├── enrich-trims.ts             — z generation Wiki stránky parsuje trim tabulky
├── enrich-images.ts            — Wikimedia Commons API, max 5 obrázků per entita
└── audit.ts                    — content_tier distribution, gaps, tenké stránky
```

### 6.3 Wikipedia parser pattern (`feedback_wikipedia_infobox_parser.md`)

- Parsoid HTML endpoint (`en.wikipedia.org/api/rest_v1/page/html/<title>`) → cheerio
- 4 progressive fallbacks: structured infobox table → Wikidata cross-reference → unstructured prose regex → manual TODO log
- Vždy logovat zdroj (`source: 'wiki-infobox' | 'wikidata' | 'prose-regex'`) do per-row JSON sloupce
- Throttle 1 req/s + User-Agent header s contact email

### 6.4 CZ overlay workflow

CZ texty se píší ručně do `description_cs` přes Supabase SQL editor nebo migration:

```sql
-- migrations/0010_cz_overlay_impreza.sql
UPDATE models SET
  tagline_cs = 'Symetrický 4×4 a Boxer motor v kompaktu, který dělal historii v rally.',
  description_cs = E'## Co je Impreza\n\nImpreza je kompaktní rodinné auto...',
  content_tier = 'gold'
WHERE slug = 'impreza';
```

**Cílový stav launchu**:
- 12 hero modelů na `gold` tier — konkrétně: Impreza, WRX, WRX STI, Forester, Outback, Legacy, BRZ, Levorg, XV (Crosstrek), SVX, Justy, Tribeca
- Zbytek (~15-18 JDM/menší: Alcyone, Vivio, R1, R2, Stella, Pleo, Sambar, Domingo, Trezia, Dex, Exiga, Baja, B9 Tribeca, Ascent, Rex) na `silver` minimum
- Generace: alespoň `description_cs` 200-400 znaků per generace

## 7. Komponenty (`components/`)

```
ModelHeroCard.tsx       glass card s velkou fotkou + Chakra Petch headline
ModelGrid.tsx           responsive grid s lazy images
GenerationCard.tsx      gen-specific card s kódem badge
TrimsTable.tsx          kompaktní tabulka, sticky header při scrollu
ContentTierBadge.tsx    interní (jen dev), nezobrazuje se v prod
CategoryChip.tsx        Filter chip s active state
AdSlot.tsx              wrapper na AdSense kod, lazy mount po First Paint
AffiliateStrip.tsx      řádek tlačítek Sauto/TipCars/Aukro s utm_source
WikipediaCitation.tsx   malé "Zdroj: Wikipedia / Wikidata Q12345"
```

## 8. Monetizace

### 8.1 Display ads (AdSense)
3 sloty max per stránka:
- `header-banner` — pod navem, responsive 728×90 / 320×100
- `mid-content` — v půlce description_cs, in-article fluid responsive
- `sidebar` (desktop ≥1280px) — sticky 300×600 na model/generation pages

**Implementace:**
- `AdSlot.tsx` lazy mount via IntersectionObserver (rootMargin: 200px)
- `min-height` placeholder pro CLS prevence (CLS < 0.1)
- `app/ads.txt/route.ts` server response s pub-id
- **CMP**: Funding Choices (Google) free tier — GDPR pro CZ traffic povinné
- **Migrace na Ezoic při 10k MV** (Phase 2)

### 8.2 Affiliate
`AffiliateStrip.tsx` na každé model + generation stránce, dole před related sekcí:
- **Sauto.cz** — `https://www.sauto.cz/inzerce/osobni/subaru/<model-slug>?utm_source=czechsubaruclub`
- **TipCars** — `https://www.tipcars.com/subaru/?model=<slug>&utm_source=czechsubaruclub`
- **Aukro** — `https://aukro.cz/hledej?q=subaru+<slug>&utm_source=czechsubaruclub`

Direct links bez partner programu v MVP; Phase 2 → Mall Partner / Heureka Partner.

### 8.3 Out of MVP scope
- Sponsored content (brand trust + Helpful Content algoritmus risk)
- Per-stránka custom affiliate overrides (Phase 2 přes `cz_context.topic = 'affiliate-overrides'`)

## 9. SEO

- Strukturovaná data `schema.org/Vehicle` per generace (Wikipedia infobox → JSON-LD)
- OG images: generované per stránka přes `app/api/og/[type]/[slug]/route.ts` — temný gradient + model jméno Chakra Petch
- Sitemap.xml: dynamický z DB, vč. `lastmod` z `updated_at`
- `robots.txt` allow all + sitemap odkaz
- Canonical URL = `https://czechsubaruclub.cz/modely/<slug>[/<gen>]`
- 301 redirects z legacy `/subaru/<cokoli>` — mapping post-launch z GSC top URLs

## 10. Analytika

- **GA4** — nový property pro clean attribution
- **Search Console** — verifikace přes DNS TXT nebo `google-site-verification` meta
- **Tracking events** (GA4 custom):
  - `model_view`, `generation_view` (auto z page_view, custom param `model_slug`)
  - `affiliate_click` (Sauto/TipCars/Aukro tlačítka → onClick gtag event)
  - `search_query` (catalog search input → debounced event)
  - `ad_impression` (z AdSense API, optional)

## 11. Performance budgets

- **LCP** < 2.5s — ad lazy mount drží tohle
- **CLS** < 0.1 — `min-height` placeholder pro ad slot před mount
- **INP** < 200ms — žádné synchronní ad SDK init
- Font preload: `<link rel="preload" href="/fonts/chakra-petch-700.woff2" as="font" crossorigin>`
- Tailwind v4 + CSS `@plugin '@tailwindcss/typography';` direktiva (`reference_tailwind_v4_plugins.md`)

## 12. Testing

- **Unit testy**: Drizzle queries (svetovestadiony pattern)
- **E2E**: 1 happy-path Playwright test (homepage → /modely → /modely/impreza → /modely/impreza/gj-2011-2016) jako regression guard
- **TDD discipline**:
  - Pipeline scripty: ANO (Wikipedia parser by měl mít test fixtures z reálné Wiki response)
  - Render: NE (UI-first, brzda by zpomalila launch)
- Žádný CI gate v MVP (jen `npm run check` před commit; CI Phase 2)

## 13. Roadmap k launchi (6 týdnů)

| Phase | Co se ship | Týden |
|---|---|---|
| 0 | Stack scaffold (Next.js 16 + Drizzle + Supabase nový projekt + Vercel link + GitHub repo) | 1 |
| 1 | DB schema (5 migrací: models, generations, trims, media, cz_context) + curated seed-models.ts | 1 |
| 2 | Pipeline scripty (Wikidata + Wikipedia enrichment + images) | 2 |
| 3 | Render: layout shell + homepage + /modely katalog | 3 |
| 4 | Render: model detail + generation detail + komponenty | 3-4 |
| 5 | CZ overlay texty (12 hero modelů na gold, zbytek silver) | 4-5 |
| 6 | AdSense integration + CMP + GA4 + sitemap + OG images | 5 |
| 7 | Audit + 301 redirect mapping | 6 |
| 8 | Launch → DNS switch → GSC submission → AdSense review request | 6 |

## 14. Launch criteria (content quality gate)

Audit script vypíše stav. Před launchem:
- 12 hero modelů na `content_tier='gold'`
- Modely s `content_tier='bronze'` → <8 (zbytek silver+)
- Modely s `description_cs` < 100 znaků → fix nebo accept jako bronze
- Generace bez `hero_image_url` → fix nebo accept (některé JDM nemají Wikimedia obrázek)
- ≥80% generací s `description_cs` ≥ 200 znaků
- ≥70% generací s `hero_image_url`

## 15. Out of MVP scope (Phase 2+)

- Motory jako entity (EJ20, FA20, FB25 page)
- Motorsport sekce (WRC sezóny, drivers, livery galerie)
- Concept cars (VIZIV, Advanced Tourer)
- Comparison tool (side-by-side 2 generations)
- "Auta na prodej" feed (scrape Sauto API)
- User accounts / wishlist (UGC explicitně out)
- EN verze (CZ-first dle domény)
- Mobile app
- Admin UI pro CZ texty (zatím přes SQL migrations)

## 16. Risks & mitigace

| Risk | Mitigace |
|---|---|
| Wikipedia EN článek o JDM modelu chybí/strohý | Fallback na JP Wiki (manual translation) nebo accept thin page |
| AdSense odmítne new domain | 301 redirect z legacy /subaru přidá traffic; waitlist 2 týdny po launchi než pošleme review |
| Doménový kredit z `/subaru` redirect se rozpustí | Implementovat 301 mapping legacy URLs → /modely/* před launchem |
| Vercel kvóta Image Transformations | Supabase Storage transformer, NE next/image (`project_svetovestadiony_image_quota.md`) |
| Pipeline narazí na rate-limit Wikipedie | Throttle 1 req/s + User-Agent header s contact email |
| Curated whitelist propustí JDM model | Audit script vyloží chybějící známá auta; doplníme ručně |

## 17. Env vars (Vercel + .env.local)

```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
NEXT_PUBLIC_ADSENSE_CLIENT_ID
NEXT_PUBLIC_GA_ID
WIKIPEDIA_USER_AGENT       # např. "czechsubaruclub.cz pipeline / info@samecdigital.com"
```

## 18. Reference do user memory

- `feedback_wikipedia_infobox_parser.md` — Parsoid HTML + cheerio + 4 fallback strategie
- `feedback_wikidata_curation.md` — curated whitelist > heuristics, EXCLUDE_QIDS patterns
- `project_svetovestadiony.md` — analogický stack + pipeline pattern
- `project_golfgreenmap.md` — analogický stack
- `reference_supabase_projects.md` — pro nový Supabase projekt
- `reference_tailwind_v4_plugins.md` — CSS @plugin syntax
- `project_svetovestadiony_image_quota.md` — Vercel Image kvóta lesson
- `project_vps_migration_consideration.md` — Supabase konsolidace zvážena, ale ne nyní
- `reference_samec_digital_sro.md` — Samec Digital footer brand info
- `feedback_czech_quotes_json.md` — pozor na curly quotes při psaní CS dat

## 19. Stav po brainstormu

- **Schválen**: vizuální směr A, stack Next.js 16 + Supabase + Drizzle, big bang launch 100-150 stránek, hybridní EN Wiki + ruční CZ overlay pipeline, AdSense → Ezoic monetizace, /modely/<slug>/<generace> URL struktura
- **Další krok**: writing-plans skill → rozbití do implementačních fází s atomic tasks
