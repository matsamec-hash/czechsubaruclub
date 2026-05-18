import { config } from "dotenv";
config({ path: ".env.local" });

import { db, schema } from "@/lib/db";
import { writeFileSync } from "node:fs";

const CATEGORY_LABEL: Record<string, string> = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  suv: "SUV",
  wagon: "Kombi",
  coupe: "Coupé",
  kei: "Kei",
  minivan: "MPV",
  pickup: "Pickup",
};

const HISTORY = [
  { year: 1917, title: "Nakajima Aircraft", body: "Kořeny Subaru. Nakajima vyrábí stíhačky pro japonskou armádu." },
  { year: 1953, title: "Fuji Heavy Industries", body: "Pět z dvanácti pováleckých firem se spojuje zpět do FHI." },
  { year: 1958, title: "Subaru 360", body: "První produkční auto — kei mikrokar, 16 koní. Vyráběl se 12 let." },
  { year: 1966, title: "Subaru 1000", body: "První japonský sériový vůz s Boxer motorem a předním pohonem." },
  { year: 1972, title: "Leone 4WD", body: "První masově vyráběné osobní auto s pohonem 4×4 na světě." },
  { year: 1989, title: "Legacy", body: "Premium sedan/kombi pro export. Symbol spolehlivosti." },
  { year: 1992, title: "Impreza", body: "Kompaktní platforma co položí WRC rally legendu." },
  { year: 1995, title: "Colin McRae mistr světa", body: "WRC titul. Subaru bere konstruktérský titul ve třech letech v řadě." },
  { year: 2012, title: "BRZ", body: "Lehký RWD coupé s FA20 Boxerem — pure driver's car bez turba." },
  { year: 2017, title: "Subaru Corp.", body: "FHI se přejmenovává na Subaru Corporation." },
  { year: 2022, title: "Solterra — první EV", body: "Plně elektrické Subaru. AWD zachováno." },
];

(async () => {
  const rows = await db.select().from(schema.models).orderBy(schema.models.slug);
  const cats = Array.from(new Set(rows.map((r) => r.category))).sort();
  const heroes = rows.filter((r) => ["impreza", "wrx-sti", "brz"].includes(r.slug));
  const heroSlugs = new Set(heroes.map((h) => h.slug));
  const rest = rows.filter((r) => !heroSlugs.has(r.slug));

  const card = (m: (typeof rows)[number]) => {
    const years = m.productionStart && m.productionEnd ? `${m.productionStart}–${m.productionEnd}` : m.productionStart ? `od ${m.productionStart}` : "";
    return `<a class="card" data-cat="${m.category}" data-name="${m.name.toLowerCase()}" href="https://www.wikidata.org/wiki/${m.wikidataQid}" target="_blank">
  <div class="ph">${m.heroImageUrl ? `<img src="${m.heroImageUrl}" loading="lazy" alt="${m.name}">` : ""}</div>
  <div class="meta">
    <div class="meta-row">
      <span class="model-name">${m.name}</span>
      <span class="model-cat">${CATEGORY_LABEL[m.category] ?? m.category}</span>
    </div>
    <div class="years">${years}</div>
  </div>
</a>`;
  };

  const bentoCard = (m: (typeof rows)[number], size: "lg" | "md" | "sm") => {
    const years = m.productionStart && m.productionEnd ? `${m.productionStart}–${m.productionEnd}` : m.productionStart ? `od ${m.productionStart}` : "";
    return `<a class="bento ${size}" href="https://www.wikidata.org/wiki/${m.wikidataQid}" target="_blank">
  <div class="ph">${m.heroImageUrl ? `<img src="${m.heroImageUrl}" loading="lazy" alt="${m.name}">` : ""}</div>
  <div class="bento-meta">
    <span class="model-cat">${CATEGORY_LABEL[m.category] ?? m.category}</span>
    <h2>${m.name}</h2>
    <span class="years">${years}</span>
  </div>
</a>`;
  };

  const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Czech Subaru Club — Encyklopedie</title>
<link rel="preconnect" href="https://upload.wikimedia.org" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap">
<style>
  /* === RESET === */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    background: #0a0a0c;
    color: #e8e8ea;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    overflow-x: hidden;
    font-feature-settings: "cv11", "ss01";
    letter-spacing: -0.011em;
  }

  /* === COLORS === */
  :root {
    --bg: #0a0a0c;
    --bg-elev: #131316;
    --fg: #fafafa;
    --fg-2: #a1a1a8;
    --fg-3: #5d5d65;
    --line: rgba(255,255,255,0.06);
    --line-strong: rgba(255,255,255,0.12);
    --accent: #4a8dff;
    --accent-soft: rgba(74,141,255,0.12);
  }

  /* === SUBTLE NOISE & GRADIENT === */
  body::before {
    content: "";
    position: fixed; inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(74,141,255,0.04) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74,141,255,0.025) 0%, transparent 50%);
    z-index: -1; pointer-events: none;
  }
  body::after {
    content: "";
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.025 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    z-index: -1; pointer-events: none;
  }

  /* === NAV === */
  .nav {
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    background: rgba(10,10,12,0.6);
    border-bottom: 1px solid var(--line);
  }
  .nav-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 14px 32px;
    display: flex; align-items: center; gap: 40px;
  }
  .logo {
    font-size: 15px; letter-spacing: -0.02em;
    text-decoration: none; color: var(--fg);
    font-weight: 500;
    display: flex; align-items: center; gap: 10px;
  }
  .logo-mark {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--accent);
    position: relative;
  }
  .logo-mark::after {
    content: ""; position: absolute; inset: 4px;
    background: var(--bg);
    border-radius: 50%;
  }
  .nav-links {
    display: flex; gap: 28px;
    font-size: 13px; color: var(--fg-2);
    font-weight: 400;
  }
  .nav-links a {
    color: inherit; text-decoration: none;
    transition: color 0.15s;
  }
  .nav-links a:hover { color: var(--fg); }
  .nav-search {
    margin-left: auto;
    position: relative; flex: 0 0 220px;
  }
  .nav-search input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 12px 7px 32px;
    color: var(--fg);
    font-family: inherit; font-size: 13px;
    outline: none;
    transition: all 0.15s;
  }
  .nav-search input::placeholder { color: var(--fg-3); }
  .nav-search input:focus {
    border-color: var(--line-strong);
    background: rgba(255,255,255,0.06);
  }
  .nav-search::before {
    content: ""; position: absolute;
    left: 11px; top: 50%; transform: translateY(-50%);
    width: 13px; height: 13px;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d5d65' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/></svg>") no-repeat center / contain;
  }

  /* === LAYOUT === */
  .container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
  .narrow { max-width: 880px; }

  /* === REVEAL === */
  .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
  .reveal.in { opacity: 1; transform: translateY(0); }

  /* === HERO === */
  .hero {
    padding: 160px 0 200px;
    text-align: left;
  }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--fg-2);
    margin-bottom: 40px;
    font-weight: 500;
  }
  .eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
    animation: pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  h1 {
    font-size: clamp(56px, 9vw, 144px);
    line-height: 0.92;
    letter-spacing: -0.045em;
    font-weight: 600;
    margin: 0;
    color: var(--fg);
    max-width: 1000px;
  }
  h1 em {
    font-family: "Instrument Serif", "Times New Roman", serif;
    font-style: italic;
    font-weight: 400;
    color: var(--fg);
    letter-spacing: -0.02em;
  }
  .hero-sub {
    font-size: clamp(17px, 1.4vw, 21px);
    line-height: 1.5;
    color: var(--fg-2);
    margin: 40px 0 0;
    max-width: 600px;
    font-weight: 400;
  }
  .hero-cta {
    margin-top: 56px;
    display: flex; gap: 12px; flex-wrap: wrap;
    align-items: center;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px;
    border-radius: 100px;
    font-weight: 500; font-size: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer; border: none; font-family: inherit;
  }
  .btn-primary {
    background: var(--fg);
    color: var(--bg);
  }
  .btn-primary:hover {
    background: var(--accent);
    color: var(--fg);
  }
  .btn-ghost {
    background: transparent;
    color: var(--fg-2);
    border: 1px solid var(--line);
  }
  .btn-ghost:hover {
    color: var(--fg);
    border-color: var(--line-strong);
  }
  .btn-arrow {
    color: var(--fg-2);
    text-decoration: none;
    font-size: 14px;
    display: inline-flex; align-items: center; gap: 4px;
    transition: gap 0.2s, color 0.2s;
  }
  .btn-arrow:hover { color: var(--fg); gap: 8px; }

  /* === HERO META STRIP === */
  .hero-strip {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-top: 96px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
  }
  .hs-stat {
    padding-right: 32px;
  }
  .hs-stat:not(:last-child) {
    border-right: 1px solid var(--line);
    margin-right: 32px;
  }
  .hs-n {
    font-size: 28px; font-weight: 500;
    color: var(--fg);
    letter-spacing: -0.025em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .hs-l {
    color: var(--fg-3);
    font-size: 12px;
    margin-top: 8px;
    font-weight: 400;
  }

  /* === SECTION === */
  .section { padding: 140px 0 0; }
  .section-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 56px;
    flex-wrap: wrap; gap: 20px;
  }
  .section-head h2 {
    font-size: clamp(36px, 4.5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.035em;
    margin: 0;
    line-height: 1;
    color: var(--fg);
  }
  .section-head h2 em {
    font-family: "Instrument Serif", serif;
    font-style: italic;
    font-weight: 400;
  }
  .section-head .num {
    display: inline-block;
    font-size: 12px;
    color: var(--fg-3);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    margin-bottom: 16px;
    letter-spacing: 0.02em;
  }
  .section-head .sub {
    color: var(--fg-3);
    font-size: 14px;
    text-align: right;
    max-width: 300px;
  }

  /* === ROZCESTNÍK — minimal cards === */
  .rozcestnik {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .roz-card {
    padding: 40px 32px;
    text-decoration: none; color: inherit;
    transition: background 0.25s;
    border-right: 1px solid var(--line);
    position: relative;
    display: block;
  }
  .roz-card:last-child { border-right: none; }
  .roz-card:hover { background: rgba(255,255,255,0.02); }
  .roz-num {
    font-size: 11px; color: var(--fg-3);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    margin-bottom: 56px;
    display: block;
  }
  .roz-card h3 {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    color: var(--fg);
  }
  .roz-card .count {
    font-size: 13px; color: var(--fg-2);
    line-height: 1.4;
  }
  .roz-card::after {
    content: "→";
    position: absolute;
    bottom: 32px; right: 32px;
    color: var(--fg-3);
    font-size: 16px;
    transition: all 0.25s;
  }
  .roz-card:hover::after {
    color: var(--fg);
    transform: translateX(4px);
  }

  /* === BENTO HERO MODELS === */
  .bento-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    grid-template-rows: 360px 280px;
    gap: 8px;
  }
  .bento.lg { grid-row: span 2; }
  .bento {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
    background: var(--bg-elev);
  }
  .bento .ph { position: absolute; inset: 0; }
  .bento .ph img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 1.2s cubic-bezier(0.16,1,0.3,1);
    filter: brightness(0.85);
  }
  .bento:hover .ph img { transform: scale(1.05); filter: brightness(1); }
  .bento::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,10,12,0.85) 0%, transparent 50%);
  }
  .bento-meta {
    position: absolute;
    bottom: 24px; left: 24px; right: 24px;
    z-index: 1;
    display: flex; flex-direction: column; gap: 4px;
  }
  .bento h2 {
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin: 0;
    color: var(--fg);
    line-height: 1;
  }
  .bento.lg h2 { font-size: 44px; }
  .bento .model-cat {
    font-size: 11px;
    color: var(--fg-2);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .bento .years {
    font-size: 13px;
    color: var(--fg-2);
    font-variant-numeric: tabular-nums;
  }

  /* === FILTER BAR === */
  .filter-bar {
    display: flex; gap: 6px; align-items: center;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .chip {
    padding: 6px 14px;
    border-radius: 100px;
    background: transparent;
    border: 1px solid var(--line);
    color: var(--fg-2);
    font-family: inherit; font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .chip:hover {
    color: var(--fg);
    border-color: var(--line-strong);
  }
  .chip.active {
    background: var(--fg);
    border-color: var(--fg);
    color: var(--bg);
    font-weight: 500;
  }
  .filter-search {
    flex: 1; min-width: 180px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--line);
    border-radius: 100px;
    padding: 6px 14px;
    color: var(--fg);
    font-family: inherit; font-size: 13px;
    outline: none;
  }
  .filter-search::placeholder { color: var(--fg-3); }
  .filter-search:focus { border-color: var(--line-strong); }

  /* === MODEL GRID === */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }
  .card {
    position: relative; display: block;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 4px;
    background: var(--bg-elev);
    text-decoration: none; color: inherit;
    transition: opacity 0.3s;
  }
  .card.hidden { display: none; }
  .card .ph { position: absolute; inset: 0; }
  .card .ph img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 1.2s cubic-bezier(0.16,1,0.3,1), filter 0.4s;
    filter: brightness(0.85);
  }
  .card:hover .ph img { transform: scale(1.05); filter: brightness(1); }
  .card::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,10,12,0.92) 0%, transparent 45%);
  }
  .card .meta {
    position: absolute;
    bottom: 16px; left: 16px; right: 16px;
    z-index: 1;
  }
  .meta-row {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .model-name {
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--fg);
  }
  .model-cat {
    font-size: 10px;
    color: var(--fg-3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .card .years {
    font-size: 12px;
    color: var(--fg-2);
    font-variant-numeric: tabular-nums;
  }

  /* === COMMUNITY === */
  .phase-badge {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(74,141,255,0.1);
    color: var(--accent);
    border-radius: 4px;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-left: 12px;
    font-weight: 500;
    vertical-align: middle;
  }
  .community-cta {
    padding: 56px;
    background: var(--bg-elev);
    border-radius: 16px;
    margin-bottom: 56px;
    display: grid; grid-template-columns: 1.5fr 1fr;
    gap: 56px;
    align-items: center;
  }
  .community-cta-text h3 {
    font-size: clamp(24px, 2.4vw, 36px);
    font-weight: 500;
    letter-spacing: -0.025em;
    margin: 0 0 16px;
    line-height: 1.1;
  }
  .community-cta-text p {
    color: var(--fg-2);
    font-size: 15px; line-height: 1.6;
    margin: 0 0 28px;
    max-width: 480px;
  }
  .community-stats-row {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--line);
  }
  .cs-row {
    display: flex; justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--line);
  }
  .cs-l { font-size: 13px; color: var(--fg-2); }
  .cs-n { font-size: 16px; font-weight: 500; color: var(--fg); font-variant-numeric: tabular-nums; }

  .community-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .user-card {
    background: var(--bg-elev);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
  }
  .user-card:hover { transform: translateY(-2px); }
  .user-photo {
    aspect-ratio: 16/10;
    overflow: hidden;
  }
  .user-photo img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 1s;
  }
  .user-card:hover .user-photo img { transform: scale(1.04); }
  .user-body {
    padding: 16px 20px 20px;
  }
  .user-head {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px;
  }
  .user-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--fg);
    display: flex; align-items: center; justify-content: center;
    font-weight: 500; font-size: 13px;
    flex-shrink: 0;
  }
  .user-name { font-size: 13px; font-weight: 500; }
  .user-loc { font-size: 11px; color: var(--fg-3); margin-top: 1px; }
  .user-story {
    font-size: 13px; line-height: 1.55; color: var(--fg-2);
    margin: 0;
  }
  .user-actions {
    margin-top: 12px;
    display: flex; gap: 16px;
    font-size: 12px; color: var(--fg-3);
  }

  /* === FORUM === */
  .forum-cats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 32px;
  }
  .forum-cat {
    padding: 24px;
    background: var(--bg-elev);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .forum-cat:hover { background: #1a1a1e; }
  .forum-cat h4 {
    font-size: 14px; font-weight: 500;
    margin: 0 0 6px;
    color: var(--fg);
  }
  .forum-cat-count { font-size: 12px; color: var(--fg-3); }
  .forum-threads {
    background: var(--bg-elev);
    border-radius: 8px;
    overflow: hidden;
  }
  .thread {
    display: flex; align-items: center; gap: 16px;
    padding: 18px 24px;
    text-decoration: none; color: inherit;
    border-bottom: 1px solid var(--line);
    transition: background 0.15s;
  }
  .thread:last-child { border-bottom: none; }
  .thread:hover { background: #1a1a1e; }
  .thread-main { flex: 1; min-width: 0; }
  .thread-title { font-size: 14px; font-weight: 500; color: var(--fg); margin-bottom: 4px; }
  .thread-meta { font-size: 11px; color: var(--fg-3); }
  .thread-replies {
    font-size: 12px; color: var(--fg-2);
    font-variant-numeric: tabular-nums;
  }

  /* === HISTORY === */
  .history {
    padding: 200px 0 100px;
  }
  .history-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: start;
  }
  .history-text h2 {
    font-size: clamp(40px, 5vw, 64px);
    font-weight: 500;
    letter-spacing: -0.035em; line-height: 1;
    margin: 0 0 48px;
  }
  .history-text h2 em {
    font-family: "Instrument Serif", serif;
    font-style: italic;
    font-weight: 400;
  }
  .history-text p {
    font-size: 16px; line-height: 1.7; color: var(--fg-2);
    margin: 0 0 20px;
  }
  .history-text p strong { color: var(--fg); font-weight: 500; }
  .history-image {
    aspect-ratio: 4/5;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-elev);
    position: sticky; top: 100px;
  }
  .history-image img {
    width: 100%; height: 100%; object-fit: cover;
    filter: brightness(0.9);
  }

  /* === TIMELINE === */
  .timeline {
    padding: 80px 0 200px;
  }
  .timeline-list {
    border-top: 1px solid var(--line);
  }
  .timeline-row {
    display: grid; grid-template-columns: 120px 1fr;
    padding: 32px 0;
    border-bottom: 1px solid var(--line);
    transition: background 0.2s;
    align-items: baseline;
    gap: 40px;
  }
  .timeline-row:hover { background: rgba(255,255,255,0.02); padding-left: 16px; padding-right: 16px; }
  .te-year {
    font-size: 24px;
    font-weight: 500;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .te-content { max-width: 560px; }
  .te-title {
    font-size: 18px; font-weight: 500;
    margin: 0 0 6px;
    color: var(--fg);
    letter-spacing: -0.015em;
  }
  .te-body {
    font-size: 14px; line-height: 1.55;
    color: var(--fg-2);
    margin: 0;
  }

  /* === FOOTER === */
  footer {
    margin-top: 100px;
    border-top: 1px solid var(--line);
    padding: 80px 0 40px;
  }
  .footer-grid {
    max-width: 1280px; margin: 0 auto;
    padding: 0 32px;
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
  }
  footer h4 {
    font-size: 11px; color: var(--fg);
    margin: 0 0 16px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  footer ul { list-style: none; }
  footer li { font-size: 13px; color: var(--fg-2); margin-bottom: 8px; }
  footer a { color: inherit; text-decoration: none; transition: color 0.15s; }
  footer a:hover { color: var(--fg); }
  .footer-brand-text {
    color: var(--fg-2);
    font-size: 13px;
    line-height: 1.6;
    margin: 16px 0 0;
    max-width: 320px;
  }
  .footer-bottom {
    max-width: 1280px; margin: 60px auto 0;
    padding: 32px 32px 0;
    border-top: 1px solid var(--line);
    font-size: 12px; color: var(--fg-3);
    display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }

  /* === RESPONSIVE === */
  @media (max-width: 900px) {
    .nav-inner { padding: 12px 20px; flex-wrap: wrap; gap: 16px; }
    .nav-links { font-size: 12px; gap: 16px; }
    .nav-search { flex: 1 0 100%; order: 3; }
    .container { padding: 0 20px; }
    .hero { padding: 64px 0 80px; }
    .hero-strip { grid-template-columns: 1fr 1fr; gap: 16px; }
    .hs-stat { border-right: none !important; margin-right: 0 !important; padding: 16px 0; border-bottom: 1px solid var(--line); }
    .rozcestnik { grid-template-columns: 1fr; }
    .roz-card { border-right: none; border-bottom: 1px solid var(--line); }
    .roz-card:last-child { border-bottom: none; }
    .bento-grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(3, 280px);
    }
    .bento.lg { grid-row: span 1; }
    .history-grid { grid-template-columns: 1fr; gap: 48px; }
    .history-image { position: static; }
    .community-cta { grid-template-columns: 1fr; padding: 32px; gap: 32px; }
    .community-grid { grid-template-columns: 1fr; }
    .forum-cats { grid-template-columns: 1fr 1fr; }
    .section-head { flex-direction: column; align-items: flex-start; }
    .section-head .sub { text-align: left; max-width: none; }
    .timeline-row { grid-template-columns: 80px 1fr; gap: 24px; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
</style>
</head>
<body>

<!-- === NAVIGATION === -->
<nav class="nav">
  <div class="nav-inner">
    <a href="#" class="logo">
      <span class="logo-mark"></span>
      Czech Subaru Club
    </a>
    <div class="nav-links">
      <a href="#modely">Modely</a>
      <a href="#komunita">Komunita</a>
      <a href="#diskuze">Diskuze</a>
      <a href="#historie">Historie</a>
      <a href="#timeline">Timeline</a>
    </div>
    <div class="nav-search">
      <input type="search" id="search" placeholder="Hledat" autocomplete="off">
    </div>
  </div>
</nav>

<!-- === HERO === -->
<section class="container hero">
  <div class="reveal in">
    <div class="eyebrow"><span class="eyebrow-dot"></span>Encyklopedie · ${rows.length} modelů</div>
    <h1>Czech Subaru Club <em>Encyklopedie</em> všech Subaru.</h1>
    <p class="hero-sub">Kompletní katalog modelů a generací od roku 1958 — Boxer motory, symetrický pohon 4×4, rally heritage, JDM kei rarity.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#modely">Prozkoumat modely</a>
      <a class="btn-arrow" href="#historie">O Subaru <span>→</span></a>
    </div>
  </div>

  <div class="hero-strip reveal">
    <div class="hs-stat">
      <div class="hs-n" data-count="${rows.length}">0</div>
      <div class="hs-l">Modelů</div>
    </div>
    <div class="hs-stat">
      <div class="hs-n" data-count="${cats.length}">0</div>
      <div class="hs-l">Kategorií</div>
    </div>
    <div class="hs-stat">
      <div class="hs-n" data-count="67">0</div>
      <div class="hs-l">Let historie</div>
    </div>
    <div class="hs-stat">
      <div class="hs-n">3×</div>
      <div class="hs-l">WRC titulů</div>
    </div>
  </div>
</section>

<!-- === ROZCESTNÍK === -->
<section class="section">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="num">01 — Rozcestník</div>
        <h2>Co tě tu <em>nejvíc zajímá?</em></h2>
      </div>
      <span class="sub">Vyber si, kam tě to táhne.</span>
    </div>
  </div>
  <div class="rozcestnik reveal">
    <a href="#modely" class="roz-card">
      <span class="roz-num">01</span>
      <h3>Modely</h3>
      <div class="count">${rows.length} aut · sedan, SUV, kei, coupé, kombi</div>
    </a>
    <a href="#historie" class="roz-card">
      <span class="roz-num">02</span>
      <h3>Historie firmy</h3>
      <div class="count">Od Nakajima Aircraft 1917 po Subaru Corp.</div>
    </a>
    <a href="#timeline" class="roz-card">
      <span class="roz-num">03</span>
      <h3>Timeline</h3>
      <div class="count">${HISTORY.length} klíčových milníků</div>
    </a>
    <a href="#komunita" class="roz-card">
      <span class="roz-num">04</span>
      <h3>Komunita</h3>
      <div class="count">Pochlub se autem + diskuze</div>
    </a>
  </div>
</section>

<!-- === FEATURED MODELS — BENTO === -->
<section class="container section">
  <div class="section-head reveal">
    <div>
      <div class="num">02 — Top modely</div>
      <h2><em>Ikony</em> značky.</h2>
    </div>
    <span class="sub">Tři hero modely — Impreza, WRX STI, BRZ.</span>
  </div>
  <div class="bento-grid reveal">
    ${bentoCard(heroes[0], "lg")}
    ${bentoCard(heroes[1], "md")}
    ${bentoCard(heroes[2], "md")}
    <div class="bento sm" style="background: var(--bg-elev); display:flex; align-items:center; justify-content:center; text-align: center;">
      <div style="padding: 32px;">
        <div style="font-size: 11px; color: var(--fg-3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px;">a dalších</div>
        <div style="font-size: 56px; font-weight: 500; color: var(--fg); letter-spacing: -0.03em; line-height: 1;">${rest.length}</div>
        <div style="font-size: 13px; color: var(--fg-2); margin-top: 8px;">modelů níže ↓</div>
      </div>
    </div>
    <div class="bento sm" style="background: var(--bg-elev); display:flex; align-items:center; justify-content:center; text-align: center;">
      <div style="padding: 32px;">
        <div style="font-size: 11px; color: var(--fg-3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px;">Boxer motorů</div>
        <div style="font-size: 56px; font-weight: 500; color: var(--accent); letter-spacing: -0.03em; line-height: 1; font-family: 'Instrument Serif', serif; font-style: italic;">∞</div>
        <div style="font-size: 13px; color: var(--fg-2); margin-top: 8px;">flat-four DNA</div>
      </div>
    </div>
  </div>
</section>

<!-- === ALL MODELS === -->
<section class="container section" id="modely">
  <div class="section-head reveal">
    <div>
      <div class="num">03 — Katalog</div>
      <h2>Všechny <em>modely.</em></h2>
    </div>
    <span class="sub" id="filter-count">${rest.length} zobrazeno</span>
  </div>
  <div class="filter-bar reveal">
    <button class="chip active" data-cat="all">Vše (${rest.length})</button>
    ${cats.map((c) => `<button class="chip" data-cat="${c}">${CATEGORY_LABEL[c] ?? c} (${rest.filter((r) => r.category === c).length})</button>`).join("\n    ")}
    <input class="filter-search" id="filter-search" type="search" placeholder="Filtrovat…">
  </div>
  <div class="grid reveal" id="model-grid">
    ${rest.map(card).join("\n")}
  </div>
</section>

<!-- === COMMUNITY === -->
<section class="container section" id="komunita">
  <div class="section-head reveal">
    <div>
      <div class="num">04 — Komunita <span class="phase-badge">Phase 6</span></div>
      <h2>Pochlub se se svým <em>Subaru.</em></h2>
    </div>
    <span class="sub">Galerie uživatelů — mockup.</span>
  </div>
  <div class="community-cta reveal">
    <div class="community-cta-text">
      <h3>Máš Subaru? Ukaž ho světu.</h3>
      <p>Nahraj fotky tvého auta, napiš příběh, sdílej s komunitou. Garáž, túra, restorace JDM — všechno se hodí.</p>
      <a href="#" class="btn btn-primary">Přidat moje Subaru</a>
    </div>
    <div class="community-stats-row">
      <div class="cs-row"><span class="cs-l">Sdílených aut</span><span class="cs-n">0</span></div>
      <div class="cs-row"><span class="cs-l">Členů klubu</span><span class="cs-n">0</span></div>
      <div class="cs-row"><span class="cs-l">Příběhů</span><span class="cs-n">0</span></div>
      <div class="cs-row" style="border-bottom: none;"><span class="cs-l">Místa</span><span class="cs-n">∞</span></div>
    </div>
  </div>
  <div class="community-grid reveal">
    ${rows.slice(0, 6).map((m, i) => {
      const names = ["Honza", "Tom", "Lucie", "Pavel", "Karel", "Eliška"];
      const cities = ["Praha", "Brno", "Plzeň", "Ostrava", "Hradec", "Liberec"];
      const stories = [
        "Koupil 2018, 4 sezóny rally simulátor + 1 reálná na Sosnové.",
        "Daily driver, 180 000 km, bez větších oprav. Boxer prostě jede.",
        "Restorace od 2021. Nový lak, repas motoru, originál interiér.",
        "Import z Japonska, RHD, naprostá rarita. Číslo 234 z 500.",
        "Servis pravidelně, výlet do Beskyd. 4×4 nikdy nezklamalo.",
        "JDM kei mazlík. 90 km/h max, na nákupy stačí.",
      ];
      return `<div class="user-card">
  <div class="user-photo">${m.heroImageUrl ? `<img src="${m.heroImageUrl}" alt="${m.name}" loading="lazy">` : ""}</div>
  <div class="user-body">
    <div class="user-head">
      <div class="user-avatar">${names[i][0]}</div>
      <div>
        <div class="user-name">${names[i]}</div>
        <div class="user-loc">${cities[i]} · ${m.nameFull}, ${m.productionStart}</div>
      </div>
    </div>
    <p class="user-story">${stories[i]}</p>
    <div class="user-actions">
      <span>♡ ${Math.floor(Math.random() * 50) + 5}</span>
      <span>💬 ${Math.floor(Math.random() * 12)}</span>
    </div>
  </div>
</div>`;
    }).join("\n")}
  </div>
</section>

<!-- === DISKUZE === -->
<section class="container section" id="diskuze">
  <div class="section-head reveal">
    <div>
      <div class="num">05 — Fórum <span class="phase-badge">Phase 6</span></div>
      <h2><em>Diskuze.</em></h2>
    </div>
    <span class="sub">Údržba, tuning, JDM lov — mockup.</span>
  </div>
  <div class="forum-cats reveal">
    <div class="forum-cat">
      <h4>Údržba & servis</h4>
      <div class="forum-cat-count">42 témat</div>
    </div>
    <div class="forum-cat">
      <h4>Tuning & úpravy</h4>
      <div class="forum-cat-count">28 témat</div>
    </div>
    <div class="forum-cat">
      <h4>JDM import & lov</h4>
      <div class="forum-cat-count">19 témat</div>
    </div>
    <div class="forum-cat">
      <h4>Rally & motorsport</h4>
      <div class="forum-cat-count">15 témat</div>
    </div>
  </div>
  <div class="forum-threads reveal">
    ${[
      ["EJ207 → EJ257 přestavba — co řešit?", "Tuning", "Pavel K.", 23, "2h"],
      ["Hledám díly na Alcyone XT 1989", "JDM", "Honza B.", 8, "5h"],
      ["Sambar — výhody/nevýhody jako daily?", "Údržba", "Lucie M.", 17, "včera"],
      ["WRC 1995 livery — vinyl nebo postřik?", "Tuning", "Tomáš V.", 31, "včera"],
      ["Forester SH AWD bad — diagnostika?", "Údržba", "Karel S.", 12, "2 d"],
      ["Komu se podařil import z Japonska 2025?", "JDM", "Eliška N.", 24, "3 d"],
    ].map(([title, cat, author, replies, time]) => `<a href="#" class="thread">
  <div class="thread-main">
    <div class="thread-title">${title}</div>
    <div class="thread-meta">${cat} · ${author} · před ${time}</div>
  </div>
  <div class="thread-replies">${replies} odp.</div>
</a>`).join("\n")}
  </div>
</section>

<!-- === HISTORIE === -->
<section class="container history" id="historie">
  <div class="reveal">
    <div class="num" style="font-size: 12px; color: var(--fg-3); margin-bottom: 16px;">06 — Background</div>
  </div>
  <div class="history-grid reveal">
    <div class="history-text">
      <h2>Subaru znamená <em>sjednocení.</em></h2>
      <p>Jméno „Subaru\" je japonský výraz pro souhvězdí <strong>Plejády</strong> a odráží sjednocení šesti firem, ze kterých Fuji Heavy Industries v roce 1953 vznikla. Šest hvězd v logu — pět menších plus jedna velká — symbolizuje tuto fúzi.</p>
      <p>Příběh ale začíná dřív. V roce <strong>1917</strong> vzniká Nakajima Aircraft Company, výrobce stíhaček pro japonskou armádu. Po druhé světové válce byla rozdělena na 12 firem. Pět z nich se v roce <strong>1953</strong> sloučilo zpět do FHI. Inženýr Kenji Kita prosadil přechod z výroby skútrů na auta — a tak vzniká roku 1958 první Subaru: kei mikrokar 360.</p>
      <p>Šedesátá léta přinesla průlomy. Subaru 1000 (1966) byl první japonský sériový vůz s kombinací Boxer motoru a předního pohonu. Leone (1972) přidal symetrický pohon 4×4 — a tím definoval DNA, které Subaru drží dodnes.</p>
      <p>V devadesátých letech vstupuje Subaru do rally. Impreza WRX se stává symbolem Group A éry: <strong>Colin McRae</strong> bere mistrovský titul roku 1995, manufacturer titul jde do Japonska třikrát v řadě. Modrá stříbrná livery 555 je dnes ikonická.</p>
      <p>V roce <strong>2017</strong> se Fuji Heavy Industries přejmenovává na Subaru Corporation. Auta tvoří víc než 60 % byznysu. V roce 2022 přichází Solterra — první plně elektrické Subaru. AWD samozřejmě zachováno.</p>
    </div>
    <div class="history-image">
      ${rows.find((r) => r.slug === "wrx-sti")?.heroImageUrl ? `<img src="${rows.find((r) => r.slug === "wrx-sti")?.heroImageUrl}" alt="Subaru WRX STI">` : ""}
    </div>
  </div>
</section>

<!-- === TIMELINE === -->
<section class="container timeline" id="timeline">
  <div class="section-head reveal">
    <div>
      <div class="num">07 — Chronologie</div>
      <h2><em>Klíčové</em> milníky.</h2>
    </div>
    <span class="sub">${HISTORY.length} událostí · 1917 → 2022.</span>
  </div>
  <div class="timeline-list reveal">
    ${HISTORY.map((e) => `<div class="timeline-row">
  <div class="te-year">${e.year}</div>
  <div class="te-content">
    <h3 class="te-title">${e.title}</h3>
    <p class="te-body">${e.body}</p>
  </div>
</div>`).join("\n")}
  </div>
</section>

<!-- === FOOTER === -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="logo">
        <span class="logo-mark"></span>
        Czech Subaru Club
      </div>
      <p class="footer-brand-text">Encyklopedie všech modelů Subaru v češtině. Nezávislý projekt, žádné spojení se Subaru Corporation.</p>
    </div>
    <div>
      <h4>Encyklopedie</h4>
      <ul>
        <li><a href="#modely">Modely</a></li>
        <li><a href="#historie">Historie</a></li>
        <li><a href="#timeline">Timeline</a></li>
      </ul>
    </div>
    <div>
      <h4>Komunita</h4>
      <ul>
        <li><a href="#komunita">Pochlub se</a></li>
        <li><a href="#diskuze">Diskuze</a></li>
        <li><a href="#">Rally</a></li>
      </ul>
    </div>
    <div>
      <h4>Provoz</h4>
      <ul>
        <li>Samec Digital s.r.o.</li>
        <li>IČO 29547539</li>
        <li><a href="mailto:info@samecdigital.com">info@samecdigital.com</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} Samec Digital</span>
    <span>Made with Boxer ❤ in Czechia</span>
  </div>
</footer>

<script>
  // === REVEAL ON SCROLL ===
  (function() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '-60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  })();

  // === COUNTER ANIMATION ===
  (function() {
    const counters = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const target = parseInt(el.dataset.count, 10);
          const dur = 1200;
          const start = performance.now();
          function step(t) {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(eased * target);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }
          requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  })();

  // === FILTERING ===
  const chips = document.querySelectorAll('.chip[data-cat]');
  const cards = document.querySelectorAll('#model-grid .card');
  const searchInput = document.getElementById('filter-search');
  const navSearch = document.getElementById('search');
  const countEl = document.getElementById('filter-count');
  let activeCat = 'all', query = '';
  function applyFilters() {
    let shown = 0;
    cards.forEach(c => {
      const catMatch = activeCat === 'all' || c.dataset.cat === activeCat;
      const queryMatch = !query || c.dataset.name.includes(query);
      const visible = catMatch && queryMatch;
      c.classList.toggle('hidden', !visible);
      if (visible) shown++;
    });
    countEl.textContent = shown + ' zobrazeno';
  }
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    activeCat = c.dataset.cat;
    applyFilters();
  }));
  function setQuery(v) { query = v.toLowerCase().trim(); applyFilters(); }
  searchInput.addEventListener('input', e => setQuery(e.target.value));
  navSearch.addEventListener('input', e => {
    setQuery(e.target.value);
    if (e.target.value) document.getElementById('modely').scrollIntoView({behavior:'smooth'});
  });
</script>
</body>
</html>`;

  const out = "/tmp/czechsubaruclub-preview.html";
  writeFileSync(out, html);
  console.log(`Preview written: ${out}`);
  console.log(`Rows: ${rows.length}, categories: ${cats.length}, history: ${HISTORY.length}`);
  process.exit(0);
})();
