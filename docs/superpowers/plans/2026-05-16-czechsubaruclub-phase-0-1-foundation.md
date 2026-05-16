# CzechSubaruClub Phase 0+1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit prázdné Next.js 16 + Supabase + Drizzle scaffold pro `czechsubaruclub.cz`, nasadit DB schema (5 tabulek), naseed-ovat curated whitelist 30 modelů, a deploy na Vercel s funkčním placeholder homepage.

**Architecture:** Standalone Next.js 16 App Router projekt (žádný turborepo), Supabase Postgres přes Drizzle ORM, deploy na Vercel Hobby s auto-deploy z `main`. Žádná business logika — jen foundation pro Phase 2 (Pipeline) a Phase 3 (Render). Po dokončení tohoto plánu: prázdné Next.js app na czechsubaruclub.cz placeholder, DB schema s 30 modely (žádná enrichment data zatím), repo `matsamec-hash/czechsubaruclub` živé.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Chakra Petch font, Supabase Postgres, Drizzle ORM 0.36+, pnpm 10+, Vitest pro unit testy, Vercel deploy.

**Spec reference:** `~/czechsubaruclub-brainstorm/docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md`

---

## File Structure (po dokončení tohoto plánu)

```
~/czechsubaruclub/                         (nový git repo)
├── .env.local.example                     (template env vars)
├── .gitignore
├── .nvmrc                                 (node 22)
├── README.md
├── docs/
│   └── superpowers/
│       ├── specs/2026-05-16-czechsubaruclub-encyklopedie-design.md  (kopie ze brainstorm)
│       └── plans/2026-05-16-czechsubaruclub-phase-0-1-foundation.md (kopie ze brainstorm)
├── drizzle.config.ts                      (Drizzle CLI config)
├── drizzle/                               (auto-generated migrations)
│   ├── 0000_initial_schema.sql
│   └── meta/
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── postcss.config.mjs                     (Tailwind v4)
├── tailwind.config.ts                     (optional — Tailwind v4 většinou nepotřebuje)
├── public/
│   ├── fonts/
│   │   ├── ChakraPetch-Regular.woff2
│   │   ├── ChakraPetch-Bold.woff2
│   │   └── ChakraPetch-Medium.woff2
│   ├── favicon.ico
│   └── og-default.png                     (placeholder, generuje se v Phase 3)
├── app/
│   ├── layout.tsx                         (RootLayout — body class, font preload, footer)
│   ├── page.tsx                           (homepage placeholder "Encyklopedie všech Subaru — připravujeme")
│   ├── globals.css                        (Tailwind import + @plugin typography + custom CSS vars)
│   ├── not-found.tsx                      (404 stránka)
│   └── (components)/
│       ├── Footer.tsx
│       └── SiteHeader.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                       (drizzle client singleton)
│   │   ├── schema.ts                      (re-exporty ze schema/ adresáře)
│   │   └── schema/
│   │       ├── models.ts                  (models table)
│   │       ├── generations.ts             (generations table)
│   │       ├── trims.ts                   (trims table)
│   │       ├── media.ts                   (media table)
│   │       └── cz-context.ts              (cz_context table)
│   └── env.ts                             (env var typed parser)
├── scripts/
│   └── research/
│       ├── seed-models.ts                 (curated whitelist 30 modelů → DB insert)
│       └── seed-data/
│           └── subaru-models.json         (curated data, source of truth)
├── tests/
│   ├── unit/
│   │   ├── db/
│   │   │   └── schema.test.ts             (schema integrity test)
│   │   └── seed/
│   │       └── subaru-models.test.ts      (seed data shape validation)
│   └── setup.ts                           (vitest setup s env loader)
└── vitest.config.ts
```

---

## Předpoklady (před spuštěním plánu)

- Node.js 22 nainstalovaný (lokálně přes nvm: `nvm install 22 && nvm use 22`)
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- gh CLI authenticated jako `matsamec-hash` (already done per memory)
- Vercel CLI nainstalovaný a authenticated (`vercel whoami` → matej.samec)
- Supabase účet aktivní (matsamec@gmail.com)
- Pracovní adresář: `~/` (každá task má explicitní `cd` pokud potřeba)

---

### Task 1: Inicializace pracovního adresáře a GitHub repo

**Files:**
- Create: `~/czechsubaruclub/` (nový adresář)

- [ ] **Step 1: Ověř že adresář ještě neexistuje**

Run: `ls -la ~/czechsubaruclub 2>&1 | head -3`
Expected: `ls: cannot access '/Users/matejsamec/czechsubaruclub': No such file or directory`

Pokud existuje, STOP a zjisti proč (nepřepiš).

- [ ] **Step 2: Vytvoř GitHub repo a naklonuj lokálně**

Run:
```bash
gh repo create matsamec-hash/czechsubaruclub --public \
  --description "Encyklopedie všech Subaru modelů (CZ)" \
  --clone --homepage "https://czechsubaruclub.cz"
mv czechsubaruclub ~/czechsubaruclub 2>/dev/null || true
ls ~/czechsubaruclub/
```
Expected: `README.md` (vygenerován GitHubem automaticky)

- [ ] **Step 3: Ověř že je to git repo s remote**

Run: `cd ~/czechsubaruclub && git remote -v`
Expected:
```
origin  https://github.com/matsamec-hash/czechsubaruclub.git (fetch)
origin  https://github.com/matsamec-hash/czechsubaruclub.git (push)
```

- [ ] **Step 4: Commit (úvodní stav je už commitnut z gh repo create)**

Žádný commit nutný — gh repo create vytvoří initial commit s README. Pokračujeme.

---

### Task 2: Node a pnpm version lock

**Files:**
- Create: `~/czechsubaruclub/.nvmrc`
- Create: `~/czechsubaruclub/.gitignore`

- [ ] **Step 1: Vytvoř .nvmrc**

Create file `~/czechsubaruclub/.nvmrc`:
```
22
```

- [ ] **Step 2: Aktivuj Node 22 v této shelle**

Run: `cd ~/czechsubaruclub && nvm use && node --version`
Expected: `v22.x.x` (přesná minor verze nezáleží)

- [ ] **Step 3: Vytvoř .gitignore**

Create file `~/czechsubaruclub/.gitignore`:
```
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/
.vercel/

# Production builds
build/
dist/

# Env files
.env
.env.local
.env*.local
!.env.local.example

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Test outputs
coverage/
.vitest-cache/

# Drizzle
drizzle/meta/_journal.json.bak
```

- [ ] **Step 4: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add .nvmrc .gitignore
git commit -m "chore: lock node 22 and add gitignore"
git push origin main
```

---

### Task 3: Next.js 16 scaffold s TypeScript a Tailwind v4

**Files:**
- Create: `~/czechsubaruclub/package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
- Create: `~/czechsubaruclub/app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Spusť create-next-app**

Run:
```bash
cd ~/czechsubaruclub
pnpm dlx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --no-turbopack \
  --import-alias "@/*" \
  --use-pnpm \
  --skip-install
```
**Pokud se zeptá zda přepsat README.md/`.gitignore`**: odpověz `no` pro .gitignore (máme vlastní), `yes` pro README (přepíšeme později).

Expected: vytvořené soubory `app/`, `next.config.ts`, `tsconfig.json`, `package.json`, `postcss.config.mjs`.

- [ ] **Step 2: Verify version is Next.js 16**

Run: `cd ~/czechsubaruclub && cat package.json | grep '"next"'`
Expected: `"next": "^16.x.x"` (nebo `16.x.x`)

Pokud je verze jiná, edituj package.json a změň na `"next": "^16.0.0"`.

- [ ] **Step 3: Install dependencies**

Run: `cd ~/czechsubaruclub && pnpm install`
Expected: instalace dokončena bez chyb, vytvořen `pnpm-lock.yaml` a `node_modules/`.

- [ ] **Step 4: Run dev server briefly to verify scaffold works**

Run: `cd ~/czechsubaruclub && pnpm dev &`
Wait 5 seconds, then run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000`
Expected: `200`
Then kill: `kill %1 2>/dev/null; wait 2>/dev/null`

- [ ] **Step 5: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add .
git commit -m "feat: scaffold Next.js 16 with TypeScript and Tailwind v4"
git push origin main
```

---

### Task 4: Stáhnutí Chakra Petch fontů + globals.css s Midnight Garage paletou

**Files:**
- Create: `~/czechsubaruclub/public/fonts/ChakraPetch-Regular.woff2`
- Create: `~/czechsubaruclub/public/fonts/ChakraPetch-Medium.woff2`
- Create: `~/czechsubaruclub/public/fonts/ChakraPetch-Bold.woff2`
- Modify: `~/czechsubaruclub/app/globals.css`
- Modify: `~/czechsubaruclub/app/layout.tsx`

- [ ] **Step 1: Stáhni Chakra Petch woff2 fonty z Google Fonts**

Run:
```bash
mkdir -p ~/czechsubaruclub/public/fonts
cd ~/czechsubaruclub/public/fonts

# Chakra Petch supportuje latin + latin-ext (CZ diakritika)
# URL pattern: gstatic.com hosted woff2 files
curl -sLo ChakraPetch-Regular.woff2 \
  "https://fonts.gstatic.com/s/chakrapetch/v11/cIf6MapbsEk7TDLdtEz1BwkmmKBh.woff2"
curl -sLo ChakraPetch-Medium.woff2 \
  "https://fonts.gstatic.com/s/chakrapetch/v11/cIf4MapbsEk7TDLdtEz1BwkWcuhpAg.woff2"
curl -sLo ChakraPetch-Bold.woff2 \
  "https://fonts.gstatic.com/s/chakrapetch/v11/cIf4MapbsEk7TDLdtEz1BwkWeOJlAg.woff2"

ls -la *.woff2
```
Expected: 3 soubory, každý ~30-50 kB.

**Pokud Google URL přestaly fungovat** (font může mít updatovanou verzi), použij alternativní zdroj:
```bash
pnpm dlx @fontsource/chakra-petch@latest
cp node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-ext-400-normal.woff2 ChakraPetch-Regular.woff2
cp node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-ext-500-normal.woff2 ChakraPetch-Medium.woff2
cp node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-ext-700-normal.woff2 ChakraPetch-Bold.woff2
```

- [ ] **Step 2: Přepiš globals.css na Midnight Garage paletu**

Replace contents of `~/czechsubaruclub/app/globals.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@font-face {
  font-family: "Chakra Petch";
  src: url("/fonts/ChakraPetch-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Chakra Petch";
  src: url("/fonts/ChakraPetch-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Chakra Petch";
  src: url("/fonts/ChakraPetch-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --color-bg: #050810;
  --color-bg-elevated: #0a1428;
  --color-fg: #e6eaf2;
  --color-fg-muted: #8a93a8;
  --color-accent: #4a8dff;
  --color-accent-hover: #6ea0ff;
  --color-amber: #ffb800;
  --color-glass-bg: rgba(255, 255, 255, 0.03);
  --color-glass-ring: rgba(255, 255, 255, 0.06);
}

@theme {
  --font-display: "Chakra Petch", system-ui, sans-serif;
  --font-sans: "Chakra Petch", system-ui, sans-serif;
}

html {
  background: var(--color-bg);
  color: var(--color-fg);
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Hero radial gradient utility */
.hero-radial {
  background: radial-gradient(
    ellipse at top,
    #0a1428 0%,
    #050810 70%
  );
}

/* Glass card utility */
.glass {
  background: var(--color-glass-bg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--color-glass-ring);
  border-radius: 16px;
}

/* Selection color */
::selection {
  background: var(--color-accent);
  color: var(--color-bg);
}
```

- [ ] **Step 3: Přidej @tailwindcss/typography dependency**

Run: `cd ~/czechsubaruclub && pnpm add -D @tailwindcss/typography`
Expected: installation success.

- [ ] **Step 4: Update layout.tsx s preload fontů a CZ lang**

Replace contents of `~/czechsubaruclub/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Czech Subaru Club — encyklopedie všech Subaru",
  description:
    "Kompletní encyklopedie všech modelů a generací Subaru v češtině. Boxer motory, symetrický pohon 4×4, rally heritage.",
  metadataBase: new URL("https://czechsubaruclub.cz"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <head>
        <link
          rel="preload"
          href="/fonts/ChakraPetch-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ChakraPetch-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build still works**

Run: `cd ~/czechsubaruclub && pnpm build`
Expected: build success, žádné errors.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add app/globals.css app/layout.tsx public/fonts/ package.json pnpm-lock.yaml
git commit -m "feat: add Chakra Petch fonts and Midnight Garage palette"
git push origin main
```

---

### Task 5: SiteHeader + Footer komponenty

**Files:**
- Create: `~/czechsubaruclub/app/(components)/SiteHeader.tsx`
- Create: `~/czechsubaruclub/app/(components)/Footer.tsx`
- Modify: `~/czechsubaruclub/app/layout.tsx` (vlož header+footer)

- [ ] **Step 1: Vytvoř SiteHeader.tsx**

Create file `~/czechsubaruclub/app/(components)/SiteHeader.tsx`:
```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/[0.06] bg-[#050810]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-lg tracking-tight text-white hover:text-[#4a8dff] transition"
        >
          <span className="text-[#4a8dff]">Czech</span>SubaruClub
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#8a93a8]">
          <Link href="/modely" className="hover:text-white transition">
            Modely
          </Link>
          <Link
            href="/o-projektu"
            className="hover:text-white transition hidden sm:inline"
          >
            O projektu
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Vytvoř Footer.tsx**

Create file `~/czechsubaruclub/app/(components)/Footer.tsx`:
```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24 py-12 text-sm text-[#8a93a8]">
      <div className="mx-auto max-w-6xl px-6 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-bold text-white mb-3">
            <span className="text-[#4a8dff]">Czech</span>SubaruClub
          </div>
          <p className="text-xs leading-relaxed">
            Encyklopedie všech modelů Subaru v češtině. Nezávislý projekt,
            žádné spojení se Subaru Corporation.
          </p>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Sekce</div>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/modely" className="hover:text-white transition">
                Modely
              </Link>
            </li>
            <li>
              <Link href="/o-projektu" className="hover:text-white transition">
                O projektu
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Provozovatel</div>
          <p className="text-xs leading-relaxed">
            Samec Digital s.r.o.
            <br />
            IČO 29547539
            <br />
            <a
              href="mailto:info@samecdigital.com"
              className="hover:text-white transition"
            >
              info@samecdigital.com
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 mt-8 text-xs text-[#8a93a8]/60">
        © {new Date().getFullYear()} Samec Digital s.r.o. Všechna práva
        vyhrazena.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update layout.tsx — vlož header + footer**

Replace `<body>{children}</body>` in `~/czechsubaruclub/app/layout.tsx` with:
```tsx
<body className="flex flex-col min-h-screen">
  <SiteHeader />
  <main className="flex-1">{children}</main>
  <Footer />
</body>
```

A přidej importy nahoru:
```tsx
import { SiteHeader } from "./(components)/SiteHeader";
import { Footer } from "./(components)/Footer";
```

- [ ] **Step 4: Verify build**

Run: `cd ~/czechsubaruclub && pnpm build`
Expected: build success.

- [ ] **Step 5: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add app/
git commit -m "feat: add SiteHeader and Footer with Samec Digital footer brand"
git push origin main
```

---

### Task 6: Homepage placeholder

**Files:**
- Modify: `~/czechsubaruclub/app/page.tsx`
- Create: `~/czechsubaruclub/app/not-found.tsx`

- [ ] **Step 1: Přepiš homepage**

Replace contents of `~/czechsubaruclub/app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <div className="hero-radial">
      <section className="mx-auto max-w-6xl px-6 py-32 md:py-48 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#4a8dff] mb-6">
          ▲ Midnight Garage
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-white">
          Encyklopedie
          <br />
          <span className="text-[#4a8dff]">všech Subaru</span>
        </h1>
        <p className="mt-8 text-lg text-[#8a93a8] max-w-2xl mx-auto leading-relaxed">
          Připravujeme kompletní katalog modelů a generací. Boxer motory,
          symetrický pohon 4×4, rally heritage, JDM rarity. Spuštění v
          červenci 2026.
        </p>
        <div className="mt-12 inline-flex glass px-6 py-3 text-sm text-[#8a93a8]">
          🚧 V přípravě — sledujte czechsubaruclub.cz
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Vytvoř not-found.tsx**

Create file `~/czechsubaruclub/app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hero-radial min-h-[60vh] flex items-center">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#4a8dff] mb-4">
          Error 404
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white">
          Tahle stránka neexistuje
        </h1>
        <p className="mt-6 text-[#8a93a8]">
          Buď je to typo v URL, nebo jsme tu sekci ještě nezveřejnili.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-6 py-3 bg-[#4a8dff] text-white rounded-lg font-medium hover:bg-[#6ea0ff] transition"
        >
          Zpět na úvod
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify locally**

Run:
```bash
cd ~/czechsubaruclub && pnpm dev &
sleep 5
curl -s http://localhost:3000 | grep -c "Encyklopedie"
kill %1 2>/dev/null; wait 2>/dev/null
```
Expected: `1` (substring nalezena)

- [ ] **Step 4: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add app/page.tsx app/not-found.tsx
git commit -m "feat: add homepage placeholder and 404 page"
git push origin main
```

---

### Task 7: Vercel project link + initial deploy

**Files:** žádné

- [ ] **Step 1: Login do Vercel CLI (pokud potřeba)**

Run: `vercel whoami`
Expected: `> matej.samec` (nebo tvůj Vercel username)

Pokud vrátí error, run: `vercel login` a postupuj podle emailového flow. **Nespouštěj `vercel <jiný-cmd>` před přihlášením**, hangne na device-flow ([feedback_vercel_cli_auth](memory/feedback_vercel_cli_auth.md)).

- [ ] **Step 2: Link projekt do Vercel**

Run:
```bash
cd ~/czechsubaruclub
vercel link --yes --project czechsubaruclub
```
**Pokud projekt neexistuje**, Vercel CLI ti nabídne ho vytvořit — odpověz `Y`. Vyber team `matej-samecs-projects` (nebo tvůj default team).

Expected: vytvořen `.vercel/project.json` (NEPUSHUJ — je v .gitignore).

- [ ] **Step 3: Initial deploy**

Run: `cd ~/czechsubaruclub && vercel deploy --prebuilt=false --yes`
**Pokud se zeptá na settings**: framework Next.js (auto-detected), output dir `.next` (auto), build command `pnpm build`, install command `pnpm install`.

Expected: úspěšný deploy, vrátí preview URL (např. `https://czechsubaruclub-abc123.vercel.app`).

- [ ] **Step 4: Promote first deploy to production**

Run:
```bash
cd ~/czechsubaruclub && vercel deploy --prod --yes
```
Expected: production URL (např. `https://czechsubaruclub.vercel.app`).

- [ ] **Step 5: Verify production URL works**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://czechsubaruclub.vercel.app`
Expected: `200`

- [ ] **Step 6: (Manuální user task) — DNS NENÍ teď**

DNS switch na czechsubaruclub.cz necháme až na konec Phase 8 (per spec sekce 13). Zatím běží na *.vercel.app subdomain.

- [ ] **Step 7: Nothing to commit (vercel link je v .gitignore)**

Žádný commit, pokračujeme.

---

### Task 8: Vytvoření Supabase projektu (manuální user akce + pak CLI)

**Files:**
- Create: `~/czechsubaruclub/.env.local.example`
- Modify: `~/czechsubaruclub/.gitignore` (verify .env.local excluded — už je)

- [ ] **Step 1: USER ACTION — Vytvoř Supabase projekt manuálně**

User musí přes Supabase Dashboard (https://supabase.com/dashboard) vytvořit nový projekt:
- Name: `czechsubaruclub`
- Database password: vygeneruj silné heslo, **ulož bezpečně** (např. 1Password)
- Region: `Frankfurt (eu-central-1)` (nejbližší CZ)
- Plan: Free

Po vytvoření user nahlas:
- Project URL (`https://<refid>.supabase.co`)
- Anon key
- Service role key
- Database password (potřeba pro DATABASE_URL)

**Halt task pro user action.** Po dodání údajů pokračuj.

- [ ] **Step 2: Updatuj user memory s novým project refid**

Edit `~/.claude/projects/-Users-matejsamec-Downloads/memory/reference_supabase_projects.md` — přidej řádek:
```
- **czechsubaruclub** = <refid>
```

- [ ] **Step 3: Vytvoř .env.local.example**

Create file `~/czechsubaruclub/.env.local.example`:
```bash
# Supabase
DATABASE_URL="postgresql://postgres.<refid>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
DIRECT_DATABASE_URL="postgresql://postgres.<refid>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<refid>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""

# Wikipedia pipeline
WIKIPEDIA_USER_AGENT="czechsubaruclub.cz pipeline / info@samecdigital.com"

# Analytics (vyplní se v Phase 6)
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_ADSENSE_CLIENT_ID=""
```

- [ ] **Step 4: Vytvoř lokální .env.local s reálnými hodnotami**

Create file `~/czechsubaruclub/.env.local` (NEPUSHOVAT — v .gitignore):

```bash
DATABASE_URL="postgresql://postgres.<refid>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
DIRECT_DATABASE_URL="postgresql://postgres.<refid>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<refid>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_KEY="<service-key>"
WIKIPEDIA_USER_AGENT="czechsubaruclub.cz pipeline / info@samecdigital.com"
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_ADSENSE_CLIENT_ID=""
```

Replace `<refid>`, `<db-password>`, `<anon-key>`, `<service-key>` se skutečnými hodnotami z Task 8 Step 1.

- [ ] **Step 5: Add stejné env vars do Vercel projektu**

Pro každý non-empty env var z .env.local:
```bash
cd ~/czechsubaruclub
vercel env add DATABASE_URL production
# (paste value, then enter)
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

Opakuj pro: `DIRECT_DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `WIKIPEDIA_USER_AGENT`.

**Důležitě**: žádné trailing newlines při paste ([feedback_vercel_env_newline](memory/feedback_vercel_env_newline.md)).

- [ ] **Step 6: Verify env vars v Vercel**

Run: `cd ~/czechsubaruclub && vercel env ls production`
Expected: výpis obsahuje DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, atd.

- [ ] **Step 7: Commit (jen .env.local.example, ne .env.local)**

Run:
```bash
cd ~/czechsubaruclub
git add .env.local.example
git commit -m "chore: add env vars template"
git push origin main
```

---

### Task 9: Drizzle ORM setup

**Files:**
- Create: `~/czechsubaruclub/drizzle.config.ts`
- Create: `~/czechsubaruclub/lib/db/index.ts`
- Create: `~/czechsubaruclub/lib/env.ts`

- [ ] **Step 1: Install Drizzle dependencies**

Run:
```bash
cd ~/czechsubaruclub
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg
```
Expected: úspěšná instalace.

- [ ] **Step 2: Vytvoř typed env parser**

Create file `~/czechsubaruclub/lib/env.ts`:
```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  WIKIPEDIA_USER_AGENT: z.string().default("czechsubaruclub.cz pipeline"),
  NEXT_PUBLIC_GA_ID: z.string().default(""),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().default(""),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  WIKIPEDIA_USER_AGENT: process.env.WIKIPEDIA_USER_AGENT,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
});
```

- [ ] **Step 3: Install zod**

Run: `cd ~/czechsubaruclub && pnpm add zod`

- [ ] **Step 4: Vytvoř drizzle.config.ts**

Create file `~/czechsubaruclub/drizzle.config.ts`:
```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 5: Install dotenv pro drizzle CLI**

Run: `cd ~/czechsubaruclub && pnpm add -D dotenv`

- [ ] **Step 6: Vytvoř drizzle client (zatím prázdné schema re-exporty)**

Create directory + file: `mkdir -p ~/czechsubaruclub/lib/db/schema`

Create file `~/czechsubaruclub/lib/db/schema.ts`:
```ts
export * from "./schema/models";
export * from "./schema/generations";
export * from "./schema/trims";
export * from "./schema/media";
export * from "./schema/cz-context";
```

Create file `~/czechsubaruclub/lib/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
export { schema };
```

- [ ] **Step 7: Add npm scripts**

Modify `~/czechsubaruclub/package.json` — add to `scripts` object:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 8: Commit (zatím bez schema souborů — vznikají v dalším tasku)**

Run:
```bash
cd ~/czechsubaruclub
git add drizzle.config.ts lib/env.ts lib/db/index.ts lib/db/schema.ts package.json pnpm-lock.yaml
git commit -m "feat: setup Drizzle ORM and typed env parser"
git push origin main
```

---

### Task 10: DB schema — models tabulka (TDD)

**Files:**
- Create: `~/czechsubaruclub/lib/db/schema/models.ts`
- Create: `~/czechsubaruclub/tests/unit/db/schema.test.ts`
- Create: `~/czechsubaruclub/tests/setup.ts`
- Create: `~/czechsubaruclub/vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
cd ~/czechsubaruclub
pnpm add -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Vytvoř vitest.config.ts**

Create file `~/czechsubaruclub/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Vytvoř tests/setup.ts**

Create file `~/czechsubaruclub/tests/setup.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.local" });
```

- [ ] **Step 4: Napiš failující test pro models schema**

Create file `~/czechsubaruclub/tests/unit/db/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { models } from "@/lib/db/schema";

describe("models schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(models);
    expect(cols).toContain("id");
    expect(cols).toContain("slug");
    expect(cols).toContain("name");
    expect(cols).toContain("nameFull");
    expect(cols).toContain("taglineCs");
    expect(cols).toContain("descriptionCs");
    expect(cols).toContain("descriptionEnRaw");
    expect(cols).toContain("category");
    expect(cols).toContain("productionStart");
    expect(cols).toContain("productionEnd");
    expect(cols).toContain("heroImageUrl");
    expect(cols).toContain("wikidataQid");
    expect(cols).toContain("contentTier");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});
```

- [ ] **Step 5: Spusť test, ověř že failuje**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL — `Cannot find module '@/lib/db/schema'` nebo `models is undefined`.

- [ ] **Step 6: Implementuj models schema**

Create file `~/czechsubaruclub/lib/db/schema/models.ts`:
```ts
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const models = pgTable("models", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameFull: text("name_full").notNull(),
  taglineCs: text("tagline_cs"),
  descriptionCs: text("description_cs"),
  descriptionEnRaw: text("description_en_raw"),
  category: text("category").notNull(),
  productionStart: integer("production_start"),
  productionEnd: integer("production_end"),
  heroImageUrl: text("hero_image_url"),
  wikidataQid: text("wikidata_qid"),
  contentTier: text("content_tier").notNull().default("bronze"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
```

- [ ] **Step 7: Spusť test znovu, ověř že prochází**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — `1 test passed`.

Pokud failuje s "Cannot find module './schema/models'" — protože ostatní schema soubory zatím neexistují, edit `lib/db/schema.ts` a zakomentuj řádky pro ještě neexistující soubory:
```ts
export * from "./schema/models";
// export * from "./schema/generations";
// export * from "./schema/trims";
// export * from "./schema/media";
// export * from "./schema/cz-context";
```

- [ ] **Step 8: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add lib/db/schema/models.ts lib/db/schema.ts tests/ vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add models schema with TDD test"
git push origin main
```

---

### Task 11: DB schema — generations tabulka (TDD)

**Files:**
- Create: `~/czechsubaruclub/lib/db/schema/generations.ts`
- Modify: `~/czechsubaruclub/tests/unit/db/schema.test.ts`
- Modify: `~/czechsubaruclub/lib/db/schema.ts`

- [ ] **Step 1: Přidej failující test**

Append to `~/czechsubaruclub/tests/unit/db/schema.test.ts` (uvnitř existujícího `describe` nebo přidej nový):
```ts
import { generations } from "@/lib/db/schema";

describe("generations schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(generations);
    expect(cols).toContain("id");
    expect(cols).toContain("modelId");
    expect(cols).toContain("slug");
    expect(cols).toContain("code");
    expect(cols).toContain("name");
    expect(cols).toContain("yearStart");
    expect(cols).toContain("yearEnd");
    expect(cols).toContain("descriptionCs");
    expect(cols).toContain("descriptionEnRaw");
    expect(cols).toContain("heroImageUrl");
    expect(cols).toContain("chassisCodes");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});
```

- [ ] **Step 2: Spusť test, ověř fail**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL — `Cannot find import { generations }`.

- [ ] **Step 3: Implementuj generations schema**

Create file `~/czechsubaruclub/lib/db/schema/generations.ts`:
```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { models } from "./models";

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    code: text("code"),
    name: text("name").notNull(),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
    descriptionCs: text("description_cs"),
    descriptionEnRaw: text("description_en_raw"),
    heroImageUrl: text("hero_image_url"),
    chassisCodes: text("chassis_codes").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    modelSlugUnique: uniqueIndex("generations_model_slug_unique").on(
      table.modelId,
      table.slug
    ),
  })
);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
```

- [ ] **Step 4: Uncomment generations export v schema.ts**

Edit `~/czechsubaruclub/lib/db/schema.ts`:
```ts
export * from "./schema/models";
export * from "./schema/generations";
// export * from "./schema/trims";
// export * from "./schema/media";
// export * from "./schema/cz-context";
```

- [ ] **Step 5: Spusť test, ověř pass**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — `2 tests passed`.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add lib/db/schema/generations.ts lib/db/schema.ts tests/
git commit -m "feat: add generations schema with FK to models"
git push origin main
```

---

### Task 12: DB schema — trims tabulka (TDD)

**Files:**
- Create: `~/czechsubaruclub/lib/db/schema/trims.ts`
- Modify: `~/czechsubaruclub/tests/unit/db/schema.test.ts`
- Modify: `~/czechsubaruclub/lib/db/schema.ts`

- [ ] **Step 1: Přidej failující test**

Append to `~/czechsubaruclub/tests/unit/db/schema.test.ts`:
```ts
import { trims } from "@/lib/db/schema";

describe("trims schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(trims);
    expect(cols).toContain("id");
    expect(cols).toContain("generationId");
    expect(cols).toContain("name");
    expect(cols).toContain("engineCode");
    expect(cols).toContain("engineDisplacementCc");
    expect(cols).toContain("powerHp");
    expect(cols).toContain("torqueNm");
    expect(cols).toContain("drivetrain");
    expect(cols).toContain("transmission");
    expect(cols).toContain("topSpeedKmh");
    expect(cols).toContain("zeroToHundredS");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});
```

- [ ] **Step 2: Spusť test, ověř fail**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL.

- [ ] **Step 3: Implementuj trims schema**

Create file `~/czechsubaruclub/lib/db/schema/trims.ts`:
```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { generations } from "./generations";

export const trims = pgTable("trims", {
  id: uuid("id").primaryKey().defaultRandom(),
  generationId: uuid("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  engineCode: text("engine_code"),
  engineDisplacementCc: integer("engine_displacement_cc"),
  powerHp: integer("power_hp"),
  torqueNm: integer("torque_nm"),
  drivetrain: text("drivetrain"),
  transmission: text("transmission"),
  topSpeedKmh: integer("top_speed_kmh"),
  zeroToHundredS: numeric("zero_to_100_s", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Trim = typeof trims.$inferSelect;
export type NewTrim = typeof trims.$inferInsert;
```

- [ ] **Step 4: Uncomment v schema.ts**

Edit `~/czechsubaruclub/lib/db/schema.ts`:
```ts
export * from "./schema/models";
export * from "./schema/generations";
export * from "./schema/trims";
// export * from "./schema/media";
// export * from "./schema/cz-context";
```

- [ ] **Step 5: Spusť test**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — `3 tests passed`.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add lib/db/schema/trims.ts lib/db/schema.ts tests/
git commit -m "feat: add trims schema with FK to generations"
git push origin main
```

---

### Task 13: DB schema — media tabulka (TDD)

**Files:**
- Create: `~/czechsubaruclub/lib/db/schema/media.ts`
- Modify: `~/czechsubaruclub/tests/unit/db/schema.test.ts`
- Modify: `~/czechsubaruclub/lib/db/schema.ts`

- [ ] **Step 1: Přidej failující test**

Append to `~/czechsubaruclub/tests/unit/db/schema.test.ts`:
```ts
import { media } from "@/lib/db/schema";

describe("media schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(media);
    expect(cols).toContain("id");
    expect(cols).toContain("entityType");
    expect(cols).toContain("entityId");
    expect(cols).toContain("url");
    expect(cols).toContain("altCs");
    expect(cols).toContain("credit");
    expect(cols).toContain("sortOrder");
    expect(cols).toContain("createdAt");
  });
});
```

- [ ] **Step 2: Spusť test, ověř fail**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL.

- [ ] **Step 3: Implementuj media schema**

Create file `~/czechsubaruclub/lib/db/schema/media.ts`:
```ts
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  url: text("url").notNull(),
  altCs: text("alt_cs"),
  credit: text("credit"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
```

**Pozn.:** `entityType` + `entityId` je polymorfní reference (může odkazovat na models nebo generations). FK nepoužíváme záměrně, runtime check v queries.

- [ ] **Step 4: Uncomment v schema.ts**

Edit `~/czechsubaruclub/lib/db/schema.ts`:
```ts
export * from "./schema/models";
export * from "./schema/generations";
export * from "./schema/trims";
export * from "./schema/media";
// export * from "./schema/cz-context";
```

- [ ] **Step 5: Spusť test**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — `4 tests passed`.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add lib/db/schema/media.ts lib/db/schema.ts tests/
git commit -m "feat: add media schema with polymorphic entity reference"
git push origin main
```

---

### Task 14: DB schema — cz_context tabulka (TDD)

**Files:**
- Create: `~/czechsubaruclub/lib/db/schema/cz-context.ts`
- Modify: `~/czechsubaruclub/tests/unit/db/schema.test.ts`
- Modify: `~/czechsubaruclub/lib/db/schema.ts`

- [ ] **Step 1: Přidej failující test**

Append to `~/czechsubaruclub/tests/unit/db/schema.test.ts`:
```ts
import { czContext } from "@/lib/db/schema";

describe("cz_context schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(czContext);
    expect(cols).toContain("id");
    expect(cols).toContain("modelId");
    expect(cols).toContain("generationId");
    expect(cols).toContain("topic");
    expect(cols).toContain("contentCs");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});
```

- [ ] **Step 2: Spusť test, ověř fail**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL.

- [ ] **Step 3: Implementuj cz_context schema**

Create file `~/czechsubaruclub/lib/db/schema/cz-context.ts`:
```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { models } from "./models";
import { generations } from "./generations";

export const czContext = pgTable("cz_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").references(() => models.id, {
    onDelete: "cascade",
  }),
  generationId: uuid("generation_id").references(() => generations.id, {
    onDelete: "cascade",
  }),
  topic: text("topic").notNull(),
  contentCs: text("content_cs").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CzContext = typeof czContext.$inferSelect;
export type NewCzContext = typeof czContext.$inferInsert;
```

- [ ] **Step 4: Uncomment v schema.ts**

Edit `~/czechsubaruclub/lib/db/schema.ts`:
```ts
export * from "./schema/models";
export * from "./schema/generations";
export * from "./schema/trims";
export * from "./schema/media";
export * from "./schema/cz-context";
```

- [ ] **Step 5: Spusť test**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — `5 tests passed`.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add lib/db/schema/cz-context.ts lib/db/schema.ts tests/
git commit -m "feat: add cz_context schema for thematic content blocks"
git push origin main
```

---

### Task 15: Generate a apply initial migration

**Files:**
- Create: `~/czechsubaruclub/drizzle/0000_*.sql` (auto-generated)
- Create: `~/czechsubaruclub/drizzle/meta/` (auto-generated)

- [ ] **Step 1: Generuj migraci**

Run: `cd ~/czechsubaruclub && pnpm db:generate`
Expected: výstup `1 migration created` nebo podobně, vznikl soubor v `drizzle/0000_*.sql`.

- [ ] **Step 2: Zkontroluj vygenerovanou SQL**

Run: `cd ~/czechsubaruclub && ls drizzle/ && head -100 drizzle/0000_*.sql`
Expected: SQL s `CREATE TABLE "models"`, `CREATE TABLE "generations"`, `CREATE TABLE "trims"`, `CREATE TABLE "media"`, `CREATE TABLE "cz_context"`, foreign keys, unique indexy.

Pokud něco chybí, smaž `drizzle/` a `db:generate` znovu po opravě schema.

- [ ] **Step 3: Aplikuj migraci na Supabase**

Run: `cd ~/czechsubaruclub && pnpm db:migrate`
Expected: `[✓] migrations applied` (nebo podobně).

- [ ] **Step 4: Verify v Supabase**

Run:
```bash
cd ~/czechsubaruclub
psql "$DIRECT_DATABASE_URL" -c "\dt" 2>/dev/null || \
  echo "Manually verify in Supabase Studio: https://supabase.com/dashboard/project/<refid>/editor"
```
Pokud psql není k dispozici, otevři Supabase Studio UI a ověř existenci tabulek `models`, `generations`, `trims`, `media`, `cz_context`.

- [ ] **Step 5: Commit migrace**

Run:
```bash
cd ~/czechsubaruclub
git add drizzle/
git commit -m "feat: apply initial DB migration (5 tables)"
git push origin main
```

---

### Task 16: Curated whitelist JSON (seed data source of truth)

**Files:**
- Create: `~/czechsubaruclub/scripts/research/seed-data/subaru-models.json`
- Create: `~/czechsubaruclub/tests/unit/seed/subaru-models.test.ts`

- [ ] **Step 1: Napiš failující test pro seed data shape**

Create file `~/czechsubaruclub/tests/unit/seed/subaru-models.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import seedData from "@/scripts/research/seed-data/subaru-models.json";

const HERO_MODELS = [
  "impreza",
  "wrx",
  "wrx-sti",
  "forester",
  "outback",
  "legacy",
  "brz",
  "levorg",
  "xv",
  "svx",
  "justy",
  "tribeca",
];

const VALID_CATEGORIES = [
  "sedan",
  "hatchback",
  "suv",
  "wagon",
  "coupe",
  "jdm",
  "kei",
  "minivan",
  "pickup",
];

describe("subaru-models.json seed data", () => {
  it("obsahuje array záznamů", () => {
    expect(Array.isArray(seedData)).toBe(true);
    expect(seedData.length).toBeGreaterThanOrEqual(27);
    expect(seedData.length).toBeLessThanOrEqual(35);
  });

  it("každý záznam má povinné fieldy", () => {
    for (const entry of seedData) {
      expect(entry).toHaveProperty("slug");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("nameFull");
      expect(entry).toHaveProperty("wikipediaEnTitle");
      expect(entry).toHaveProperty("wikidataQid");
      expect(entry).toHaveProperty("category");
    }
  });

  it("slugy jsou unique a kebab-case", () => {
    const slugs = seedData.map((e: any) => e.slug);
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const slug of slugs) {
      expect(slug).toMatch(slugRegex);
    }
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("kategorie jsou jen z povolené sady", () => {
    for (const entry of seedData) {
      expect(VALID_CATEGORIES).toContain(entry.category);
    }
  });

  it("Wikidata QIDs jsou ve formátu Q<číslo>", () => {
    for (const entry of seedData) {
      expect(entry.wikidataQid).toMatch(/^Q\d+$/);
    }
  });

  it("obsahuje všech 12 hero modelů", () => {
    const slugs = seedData.map((e: any) => e.slug);
    for (const heroSlug of HERO_MODELS) {
      expect(slugs).toContain(heroSlug);
    }
  });
});
```

- [ ] **Step 2: Spusť test, ověř fail**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: FAIL — `Cannot find module ... subaru-models.json`.

- [ ] **Step 3: Vytvoř curated whitelist JSON**

Run: `mkdir -p ~/czechsubaruclub/scripts/research/seed-data`

Create file `~/czechsubaruclub/scripts/research/seed-data/subaru-models.json`:
```json
[
  {
    "slug": "impreza",
    "name": "Impreza",
    "nameFull": "Subaru Impreza",
    "wikipediaEnTitle": "Subaru_Impreza",
    "wikidataQid": "Q834945",
    "category": "sedan",
    "productionStart": 1992
  },
  {
    "slug": "wrx",
    "name": "WRX",
    "nameFull": "Subaru WRX",
    "wikipediaEnTitle": "Subaru_WRX",
    "wikidataQid": "Q1751980",
    "category": "sedan",
    "productionStart": 2014
  },
  {
    "slug": "wrx-sti",
    "name": "WRX STI",
    "nameFull": "Subaru WRX STI",
    "wikipediaEnTitle": "Subaru_WRX_STI",
    "wikidataQid": "Q1751987",
    "category": "sedan",
    "productionStart": 1994
  },
  {
    "slug": "forester",
    "name": "Forester",
    "nameFull": "Subaru Forester",
    "wikipediaEnTitle": "Subaru_Forester",
    "wikidataQid": "Q834907",
    "category": "suv",
    "productionStart": 1997
  },
  {
    "slug": "outback",
    "name": "Outback",
    "nameFull": "Subaru Outback",
    "wikipediaEnTitle": "Subaru_Outback",
    "wikidataQid": "Q834916",
    "category": "wagon",
    "productionStart": 1994
  },
  {
    "slug": "legacy",
    "name": "Legacy",
    "nameFull": "Subaru Legacy",
    "wikipediaEnTitle": "Subaru_Legacy",
    "wikidataQid": "Q1142251",
    "category": "sedan",
    "productionStart": 1989
  },
  {
    "slug": "brz",
    "name": "BRZ",
    "nameFull": "Subaru BRZ",
    "wikipediaEnTitle": "Subaru_BRZ",
    "wikidataQid": "Q908543",
    "category": "coupe",
    "productionStart": 2012
  },
  {
    "slug": "levorg",
    "name": "Levorg",
    "nameFull": "Subaru Levorg",
    "wikipediaEnTitle": "Subaru_Levorg",
    "wikidataQid": "Q15994830",
    "category": "wagon",
    "productionStart": 2014
  },
  {
    "slug": "xv",
    "name": "XV",
    "nameFull": "Subaru XV (Crosstrek)",
    "wikipediaEnTitle": "Subaru_Crosstrek",
    "wikidataQid": "Q907578",
    "category": "suv",
    "productionStart": 2011
  },
  {
    "slug": "svx",
    "name": "SVX",
    "nameFull": "Subaru SVX",
    "wikipediaEnTitle": "Subaru_SVX",
    "wikidataQid": "Q1142306",
    "category": "coupe",
    "productionStart": 1991,
    "productionEnd": 1996
  },
  {
    "slug": "justy",
    "name": "Justy",
    "nameFull": "Subaru Justy",
    "wikipediaEnTitle": "Subaru_Justy",
    "wikidataQid": "Q1142242",
    "category": "hatchback",
    "productionStart": 1984
  },
  {
    "slug": "tribeca",
    "name": "Tribeca",
    "nameFull": "Subaru Tribeca",
    "wikipediaEnTitle": "Subaru_Tribeca",
    "wikidataQid": "Q834929",
    "category": "suv",
    "productionStart": 2005,
    "productionEnd": 2014
  },
  {
    "slug": "alcyone",
    "name": "Alcyone",
    "nameFull": "Subaru Alcyone (XT)",
    "wikipediaEnTitle": "Subaru_XT",
    "wikidataQid": "Q1142276",
    "category": "coupe",
    "productionStart": 1985,
    "productionEnd": 1991
  },
  {
    "slug": "vivio",
    "name": "Vivio",
    "nameFull": "Subaru Vivio",
    "wikipediaEnTitle": "Subaru_Vivio",
    "wikidataQid": "Q1370022",
    "category": "kei",
    "productionStart": 1992,
    "productionEnd": 1998
  },
  {
    "slug": "r1",
    "name": "R1",
    "nameFull": "Subaru R1",
    "wikipediaEnTitle": "Subaru_R1",
    "wikidataQid": "Q1142279",
    "category": "kei",
    "productionStart": 2005,
    "productionEnd": 2010
  },
  {
    "slug": "r2",
    "name": "R2",
    "nameFull": "Subaru R2",
    "wikipediaEnTitle": "Subaru_R2",
    "wikidataQid": "Q1142282",
    "category": "kei",
    "productionStart": 2003,
    "productionEnd": 2010
  },
  {
    "slug": "stella",
    "name": "Stella",
    "nameFull": "Subaru Stella",
    "wikipediaEnTitle": "Subaru_Stella",
    "wikidataQid": "Q1142284",
    "category": "kei",
    "productionStart": 2006
  },
  {
    "slug": "pleo",
    "name": "Pleo",
    "nameFull": "Subaru Pleo",
    "wikipediaEnTitle": "Subaru_Pleo",
    "wikidataQid": "Q1142269",
    "category": "kei",
    "productionStart": 1998
  },
  {
    "slug": "sambar",
    "name": "Sambar",
    "nameFull": "Subaru Sambar",
    "wikipediaEnTitle": "Subaru_Sambar",
    "wikidataQid": "Q1142285",
    "category": "kei",
    "productionStart": 1961
  },
  {
    "slug": "domingo",
    "name": "Domingo",
    "nameFull": "Subaru Domingo (Libero)",
    "wikipediaEnTitle": "Subaru_Domingo",
    "wikidataQid": "Q1142244",
    "category": "minivan",
    "productionStart": 1983,
    "productionEnd": 1998
  },
  {
    "slug": "trezia",
    "name": "Trezia",
    "nameFull": "Subaru Trezia",
    "wikipediaEnTitle": "Subaru_Trezia",
    "wikidataQid": "Q1142298",
    "category": "hatchback",
    "productionStart": 2010,
    "productionEnd": 2016
  },
  {
    "slug": "dex",
    "name": "Dex",
    "nameFull": "Subaru Dex",
    "wikipediaEnTitle": "Subaru_Dex",
    "wikidataQid": "Q1142243",
    "category": "hatchback",
    "productionStart": 2008,
    "productionEnd": 2011
  },
  {
    "slug": "exiga",
    "name": "Exiga",
    "nameFull": "Subaru Exiga",
    "wikipediaEnTitle": "Subaru_Exiga",
    "wikidataQid": "Q1142246",
    "category": "minivan",
    "productionStart": 2008,
    "productionEnd": 2018
  },
  {
    "slug": "baja",
    "name": "Baja",
    "nameFull": "Subaru Baja",
    "wikipediaEnTitle": "Subaru_Baja",
    "wikidataQid": "Q1142241",
    "category": "pickup",
    "productionStart": 2003,
    "productionEnd": 2006
  },
  {
    "slug": "b9-tribeca",
    "name": "B9 Tribeca",
    "nameFull": "Subaru B9 Tribeca",
    "wikipediaEnTitle": "Subaru_Tribeca",
    "wikidataQid": "Q834929",
    "category": "suv",
    "productionStart": 2005,
    "productionEnd": 2007
  },
  {
    "slug": "ascent",
    "name": "Ascent",
    "nameFull": "Subaru Ascent",
    "wikipediaEnTitle": "Subaru_Ascent",
    "wikidataQid": "Q49213283",
    "category": "suv",
    "productionStart": 2018
  },
  {
    "slug": "rex",
    "name": "Rex",
    "nameFull": "Subaru Rex",
    "wikipediaEnTitle": "Subaru_Rex",
    "wikidataQid": "Q1142270",
    "category": "kei",
    "productionStart": 1972,
    "productionEnd": 1992
  }
]
```

**Pozn.:** Wikidata QIDs jsou orientační — během Phase 2 pipeline budou ověřeny a opraveny. JSON je curated, ne authoritative (zatím).

- [ ] **Step 4: Spusť test, ověř pass**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: PASS — všech 6 testů + předchozí schema testy.

Pokud test "obsahuje všech 12 hero modelů" failuje — ověř, že každý z `HERO_MODELS` má odpovídající `slug` v JSON. Pokud "27-35 záznamů" failuje, doplň/uber.

- [ ] **Step 5: Update tsconfig pro JSON import**

Edit `~/czechsubaruclub/tsconfig.json` — ujisti se že `compilerOptions` obsahuje:
```json
"resolveJsonModule": true
```

Pokud chybí, přidej. Pokud už tam je (z create-next-app default), pokračuj.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add scripts/research/seed-data/ tests/unit/seed/ tsconfig.json
git commit -m "feat: add curated whitelist for 28 Subaru models"
git push origin main
```

---

### Task 17: Seed-models script — insert do DB

**Files:**
- Create: `~/czechsubaruclub/scripts/research/seed-models.ts`

- [ ] **Step 1: Vytvoř seed-models.ts**

Create file `~/czechsubaruclub/scripts/research/seed-models.ts`:
```ts
import "dotenv/config";
import { db, schema } from "@/lib/db";
import seedData from "./seed-data/subaru-models.json" with { type: "json" };

type SeedEntry = {
  slug: string;
  name: string;
  nameFull: string;
  wikipediaEnTitle: string;
  wikidataQid: string;
  category: string;
  productionStart?: number;
  productionEnd?: number;
};

async function main() {
  const entries = seedData as SeedEntry[];
  console.log(`[seed-models] Inserting ${entries.length} models...`);

  let inserted = 0;
  let updated = 0;

  for (const entry of entries) {
    const result = await db
      .insert(schema.models)
      .values({
        slug: entry.slug,
        name: entry.name,
        nameFull: entry.nameFull,
        category: entry.category,
        productionStart: entry.productionStart ?? null,
        productionEnd: entry.productionEnd ?? null,
        wikidataQid: entry.wikidataQid,
        contentTier: "bronze",
      })
      .onConflictDoUpdate({
        target: schema.models.slug,
        set: {
          name: entry.name,
          nameFull: entry.nameFull,
          category: entry.category,
          productionStart: entry.productionStart ?? null,
          productionEnd: entry.productionEnd ?? null,
          wikidataQid: entry.wikidataQid,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.models.id, slug: schema.models.slug });

    if (result.length > 0) {
      console.log(`[seed-models] ✓ ${entry.slug}`);
      inserted++;
    }
  }

  console.log(`[seed-models] Done. Total: ${entries.length} processed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-models] FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Install tsx pro spuštění TS scriptů**

Run: `cd ~/czechsubaruclub && pnpm add -D tsx`

- [ ] **Step 3: Add npm script**

Edit `~/czechsubaruclub/package.json` — add to `scripts`:
```json
"seed:models": "tsx scripts/research/seed-models.ts"
```

- [ ] **Step 4: Spusť seed**

Run: `cd ~/czechsubaruclub && pnpm seed:models`
Expected: výstup `✓ impreza`, `✓ wrx`, ..., `Done. Total: 28 processed.`

- [ ] **Step 5: Verify v DB**

Run:
```bash
cd ~/czechsubaruclub
node -e "
import('postgres').then(async ({default: postgres}) => {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  const rows = await sql\`SELECT slug, category FROM models ORDER BY slug\`;
  console.log('Count:', rows.length);
  rows.forEach(r => console.log(' -', r.slug, '/', r.category));
  await sql.end();
});
" 2>&1 | head -40
```
Expected: 28 modelů, slug + category per řádek.

Alternativní: otevři Supabase Studio → table editor → models.

- [ ] **Step 6: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add scripts/research/seed-models.ts package.json pnpm-lock.yaml
git commit -m "feat: add seed-models script for curated whitelist"
git push origin main
```

---

### Task 18: Kopie spec a plan do repo

**Files:**
- Create: `~/czechsubaruclub/docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md`
- Create: `~/czechsubaruclub/docs/superpowers/plans/2026-05-16-czechsubaruclub-phase-0-1-foundation.md`

- [ ] **Step 1: Vytvoř adresáře**

Run: `mkdir -p ~/czechsubaruclub/docs/superpowers/{specs,plans}`

- [ ] **Step 2: Zkopíruj spec a plan**

Run:
```bash
cp ~/czechsubaruclub-brainstorm/docs/superpowers/specs/2026-05-16-czechsubaruclub-encyklopedie-design.md \
   ~/czechsubaruclub/docs/superpowers/specs/

cp ~/czechsubaruclub-brainstorm/docs/superpowers/plans/2026-05-16-czechsubaruclub-phase-0-1-foundation.md \
   ~/czechsubaruclub/docs/superpowers/plans/
```

- [ ] **Step 3: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add docs/
git commit -m "docs: import design spec and Phase 0+1 plan from brainstorm dir"
git push origin main
```

---

### Task 19: README a CLAUDE.md

**Files:**
- Modify: `~/czechsubaruclub/README.md`
- Create: `~/czechsubaruclub/CLAUDE.md`

- [ ] **Step 1: Přepiš README.md**

Replace contents of `~/czechsubaruclub/README.md`:
```markdown
# CzechSubaruClub.cz

Encyklopedie všech Subaru modelů v češtině. Next.js 16 + Supabase + Drizzle ORM.

## Status

Phase 0+1 (Foundation) — scaffold + DB schema + curated whitelist 28 modelů.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind v4 + Chakra Petch font (Midnight Garage palette)
- **DB**: Supabase Postgres
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
```

- [ ] **Step 2: Vytvoř CLAUDE.md**

Create file `~/czechsubaruclub/CLAUDE.md`:
```markdown
# CLAUDE.md

Konvence pro Claude Code v tomto repo.

## Jazyk

Komunikuje **česky**. Commit messages, code comments a docs anglicky (technický kontext).

## Stack & vzory

- Next.js 16 App Router, žádný `src/` directory
- Tailwind v4 + CSS `@plugin` directive (NE `tailwind.config.js` plugins)
- Drizzle ORM, schema v `lib/db/schema/<table>.ts`
- Tests Vitest, jen unit (`tests/unit/`); E2E přijdou v Phase 3
- Components v `app/(components)/` nebo `app/<route>/(components)/`
- TDD pro pipeline scripty (`scripts/research/`), NE pro UI

## Bezpečnost

- Nikdy nepushuj `.env.local`
- Vercel env vars sync přes `vercel env add`
- Wikipedia pipeline throttle 1 req/s + User-Agent header

## Memory reference

User memory: `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md`
```

- [ ] **Step 3: Commit**

Run:
```bash
cd ~/czechsubaruclub
git add README.md CLAUDE.md
git commit -m "docs: add README and CLAUDE.md"
git push origin main
```

---

### Task 20: Final verification a deploy production

**Files:** žádné

- [ ] **Step 1: Spusť všechny testy**

Run: `cd ~/czechsubaruclub && pnpm test`
Expected: všechny testy projdou (6 schema testů + 6 seed data testů = 12 testů).

- [ ] **Step 2: Spusť build**

Run: `cd ~/czechsubaruclub && pnpm build`
Expected: úspěšný build, žádné errors.

- [ ] **Step 3: Verify lint passes**

Run: `cd ~/czechsubaruclub && pnpm lint`
Expected: žádné errors (warnings OK).

- [ ] **Step 4: Production deploy**

Run: `cd ~/czechsubaruclub && vercel deploy --prod --yes`
Expected: production URL, status `● Ready`.

- [ ] **Step 5: Verify production URL**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://czechsubaruclub.vercel.app`
Expected: `200`.

Run: `curl -s https://czechsubaruclub.vercel.app | grep -c "Encyklopedie"`
Expected: `1`.

- [ ] **Step 6: Verify DB row count přes production deploy**

Tohle ověřuje jen DB stav, ne deploy. Stejný DB jako lokálně:
```bash
cd ~/czechsubaruclub
psql "$DIRECT_DATABASE_URL" -c "SELECT COUNT(*) FROM models;" 2>/dev/null || \
  echo "Manuálně ověř v Supabase Studio: 28 řádků v models tabulce"
```
Expected: `count = 28` (nebo otevři Supabase Studio).

- [ ] **Step 7: Verify GitHub repo má všech 20 tasků commitů**

Run:
```bash
cd ~/czechsubaruclub
git log --oneline | wc -l
git log --oneline | head -25
```
Expected: 20-22 commitů (závisí na původním GH initial commit + tato 20 plánovaných tasků).

---

### Task 21: Memory update — Phase 0+1 dokončen

**Files:**
- Modify: `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md`
- Modify: `~/.claude/projects/-Users-matejsamec-Downloads/memory/MEMORY.md`

- [ ] **Step 1: Updatuj project memory**

Edit `~/.claude/projects/-Users-matejsamec-Downloads/memory/project_czechsubaruclub.md` — replace sekci "Stav 2026-05-16" s:
```markdown
## Stav YYYY-MM-DD (datum dokončení Task 20)

**Phase 0+1 SHIPPED.** Repo `matsamec-hash/czechsubaruclub` (public) live, Next.js 16 + Drizzle + Supabase scaffold deployed na czechsubaruclub.vercel.app, DB schema (5 tabulek: models/generations/trims/media/cz_context) migrated, 28 modelů naseed-ováno z curated whitelist (12 hero + 16 JDM/menší). Vše bronze tier — žádná enrichment data zatím.

**Další krok**: writing-plans skill pro Phase 2 (Pipeline) — Wikipedia infobox parser pattern aplikace, Wikidata enrichment, images z Wikimedia Commons.

**Stack-specific gotchas** (pro Phase 2+):
- Tailwind v4 plugins přes `@plugin` directive v globals.css (NE config.js array)
- Vercel env vars: vždy `.trim()` (newline gotcha)
- Supabase pooler URL pro DATABASE_URL (port 6543), DIRECT_DATABASE_URL pro migrace (port 5432)
- Wikipedia pipeline: throttle 1 req/s + User-Agent header povinný
```

- [ ] **Step 2: Updatuj MEMORY.md index**

Edit `~/.claude/projects/-Users-matejsamec-Downloads/memory/MEMORY.md` — najdi řádek o czechsubaruclub a updatuj na:
```markdown
- [CzechSubaruClub.cz](project_czechsubaruclub.md) — encyklopedie všech Subaru, **Phase 0+1 SHIPPED YYYY-MM-DD**: repo live, Next.js 16 + Supabase + Drizzle scaffold, 5-table schema migrated, 28 modelů (12 hero + 16 JDM) bronze tier naseed-ováno. Vercel.app placeholder homepage. Další: Phase 2 (Wikipedia/Wikidata pipeline) přes writing-plans.
```

- [ ] **Step 3: Memory files jsou auto-saved, žádný commit potřeba**

User memory files nejsou v git repu, jen lokální. Hotovo.

---

## Self-Review checklist

Po dokončení všech 21 tasků:

- [ ] Repo `matsamec-hash/czechsubaruclub` je public a má 20-22 commitů
- [ ] `https://czechsubaruclub.vercel.app` vrací 200 s "Encyklopedie všech Subaru"
- [ ] Všechny testy projdou: `pnpm test` → 12+ tests
- [ ] DB obsahuje 28 řádků v `models` tabulce
- [ ] `.env.local` má všechny env vars, NE v gitu
- [ ] Vercel env vars sync (production, preview, development)
- [ ] User memory updated

---

## Pokud něco selže

**Drizzle migrate selže** — ověř `DIRECT_DATABASE_URL` (port 5432, ne 6543 pooler). Pooler nepodporuje DDL.

**Vercel build selže** — typicky chybí env var v Vercel UI. Run `vercel env ls production` a porovnej se `.env.local`.

**Test schema selže s "Cannot find module"** — ověř že soubor `lib/db/schema.ts` má všechny exporty uncomment-ed po tasku 14.

**Font fetch selže** — Google CDN URL mohou být zastaralé. Fallback na `@fontsource/chakra-petch` package per Task 4 Step 1.

**`gh repo create` selže s "name already exists"** — repo už existuje. Skip Task 1 Step 2 a místo toho `gh repo clone matsamec-hash/czechsubaruclub ~/czechsubaruclub`.
