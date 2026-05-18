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

const HISTORY: Array<{ year: number; title: string; body: string }> = [
  { year: 1917, title: "Nakajima Aircraft Company", body: "Kořeny Subaru. Nakajima vyrábí letadla pro japonskou armádu — Ki-43 Hayabusa, Ki-84 Hayate. Po válce rozdělena na 12 firem." },
  { year: 1953, title: "Fuji Heavy Industries (FHI)", body: "Pět z dvanácti pováleckých firem se spojuje zpět do FHI. Inženýr Kenji Kita prosadí přechod od skútrů k autům." },
  { year: 1958, title: "Subaru 360", body: "První produkční auto — kei mikrokar 360 cm³, 16 koní, 1×4 sedák. Přezdívaný „Lady Beetle\" pro tvar. Vyráběl se 12 let, 392 000 ks." },
  { year: 1966, title: "Subaru 1000", body: "Průlom: první serial Boxer motor + přední pohon v Japonsku. Položil základ pro celé budoucí DNA Subaru." },
  { year: 1972, title: "Leone 4WD Estate Van", body: "První masově vyráběné osobní auto s pohonem 4×4 na světě. Subaru identita symetrického AWD se rodí." },
  { year: 1989, title: "Subaru Legacy", body: "Premium sedan/kombi pro export. Záznam 100 000 mil ve 4×4 trval 19 dní bez přestávky — průmyslový důkaz spolehlivosti." },
  { year: 1992, title: "Subaru Impreza", body: "Kompaktní platforma co položí WRC rally legendu. GC8 šasi, EJ20 turbo, koncept přístupné performance." },
  { year: 1994, title: "Impreza WRX STI", body: "Subaru Tecnica International (STI) divize vyladí Imprezu do homologační verze pro Group A. 280 koní z 2.0 turba." },
  { year: 1995, title: "Colin McRae mistr světa", body: "Skotský pilot vyhrává WRC s Imprezou 555. Subaru bere konstruktérský titul 1995, 1996, 1997 — éra modré stříbrné livery." },
  { year: 2003, title: "STI značka samostatná", body: "Subaru Tecnica International se osamostatní jako brand. STI Edition modely pro Imprezu, Forester, Legacy." },
  { year: 2012, title: "BRZ launch", body: "Spolupráce s Toyotou. Lehký RWD coupé s FA20 Boxerem, pohon zadních kol — pure driver's car bez turba." },
  { year: 2017, title: "Subaru Corporation", body: "Fuji Heavy Industries se přejmenovává na Subaru Corporation. Auta jsou teď víc než 60 % byznysu." },
  { year: 2022, title: "Solterra — první EV", body: "Společný projekt s Toyotou (bZ4X). Subaru vstupuje do plně elektrické éry. AWD zachováno." },
];

(async () => {
  const rows = await db.select().from(schema.models).orderBy(schema.models.slug);
  const cats = Array.from(new Set(rows.map((r) => r.category))).sort();
  const heroes = rows.filter((r) => ["impreza", "wrx-sti", "brz"].includes(r.slug));
  const heroSlugs = new Set(heroes.map((h) => h.slug));
  const rest = rows.filter((r) => !heroSlugs.has(r.slug));

  const card = (m: (typeof rows)[number]) => {
    const years = m.productionStart && m.productionEnd ? `${m.productionStart}–${m.productionEnd}` : m.productionStart ? `${m.productionStart} →` : "";
    const img = m.heroImageUrl ? `<img src="${m.heroImageUrl}" loading="lazy" alt="${m.name}">` : "";
    return `<a class="card tilt" data-cat="${m.category}" data-name="${m.name.toLowerCase()}" href="https://www.wikidata.org/wiki/${m.wikidataQid}" target="_blank">
  <div class="card-glow"></div>
  <div class="card-spotlight"></div>
  <div class="ph">${img}<div class="overlay"></div></div>
  <div class="meta">
    <div class="cat-tag">${CATEGORY_LABEL[m.category] ?? m.category}</div>
    <h3>${m.name}</h3>
    <div class="years">${years}</div>
  </div>
</a>`;
  };

  const heroCard = (m: (typeof rows)[number], variant: "main" | "side") => {
    const years = m.productionStart && m.productionEnd ? `${m.productionStart}–${m.productionEnd}` : m.productionStart ? `${m.productionStart} →` : "";
    const img = m.heroImageUrl ? `<img src="${m.heroImageUrl}" loading="lazy" alt="${m.name}">` : "";
    return `<a class="hero-card tilt ${variant}" href="https://www.wikidata.org/wiki/${m.wikidataQid}" target="_blank">
  <div class="card-glow"></div>
  <div class="card-spotlight"></div>
  <div class="ph">${img}<div class="overlay"></div></div>
  <div class="meta">
    <div class="cat-tag">${CATEGORY_LABEL[m.category] ?? m.category}</div>
    <h2>${m.name}</h2>
    <div class="years">${years}</div>
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap">
<style>
  /* === RESET === */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: "Chakra Petch", system-ui, sans-serif;
    background: #02050d;
    color: #e8edf7;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    overflow-x: hidden;
    cursor: default;
  }

  /* === AURORA BACKGROUND === */
  .aurora {
    position: fixed; inset: 0;
    z-index: -3; overflow: hidden;
    background: #02050d;
  }
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.5;
    will-change: transform;
  }
  .blob-1 { width: 800px; height: 800px; top: -300px; left: -200px;
    background: radial-gradient(circle, #4a8dff 0%, transparent 60%);
    animation: float-1 22s ease-in-out infinite;
  }
  .blob-2 { width: 700px; height: 700px; top: 40%; right: -250px;
    background: radial-gradient(circle, #8b5cf6 0%, transparent 60%);
    animation: float-2 28s ease-in-out infinite;
    opacity: 0.35;
  }
  .blob-3 { width: 600px; height: 600px; bottom: -200px; left: 30%;
    background: radial-gradient(circle, #06b6d4 0%, transparent 60%);
    animation: float-3 32s ease-in-out infinite;
    opacity: 0.4;
  }
  .blob-4 { width: 500px; height: 500px; top: 20%; left: 40%;
    background: radial-gradient(circle, #ffb800 0%, transparent 65%);
    animation: float-4 26s ease-in-out infinite;
    opacity: 0.15;
  }
  @keyframes float-1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(80px,120px) scale(1.1); }
    66% { transform: translate(-60px,80px) scale(0.95); }
  }
  @keyframes float-2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-120px,-80px) scale(1.15); }
  }
  @keyframes float-3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(140px,-100px) scale(1.05); }
  }
  @keyframes float-4 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-90px,140px) scale(1.2); }
  }
  .grid-overlay {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
    z-index: -2; pointer-events: none;
  }
  .grain {
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    z-index: -1; pointer-events: none; opacity: 1;
  }

  /* === CURSOR SPOTLIGHT (desktop only) === */
  .cursor-light {
    position: fixed;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,141,255,0.10) 0%, transparent 60%);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    z-index: 0;
    opacity: 0;
    mix-blend-mode: screen;
  }
  @media (hover: hover) {
    body:hover .cursor-light { opacity: 1; }
  }

  /* === NAV === */
  .nav {
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(24px) saturate(140%);
    -webkit-backdrop-filter: blur(24px) saturate(140%);
    background: rgba(2,5,13,0.55);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .nav-inner {
    max-width: 1440px; margin: 0 auto;
    padding: 18px 40px;
    display: flex; align-items: center; gap: 40px;
  }
  .logo {
    font-weight: 700; font-size: 19px; letter-spacing: -0.02em;
    text-decoration: none; color: #fff;
    display: flex; align-items: center; gap: 10px;
    transition: transform 0.2s;
  }
  .logo:hover { transform: scale(1.02); }
  .logo-mark {
    width: 28px; height: 28px;
    background: conic-gradient(from 0deg, #4a8dff, #8b5cf6, #4a8dff);
    border-radius: 50%;
    position: relative;
    animation: spin-slow 12s linear infinite;
  }
  .logo-mark::after {
    content: ""; position: absolute; inset: 3px;
    background: #02050d;
    border-radius: 50%;
  }
  .logo-mark::before {
    content: ""; position: absolute; inset: 8px;
    background: #4a8dff;
    border-radius: 50%;
    z-index: 1;
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .logo span { background: linear-gradient(135deg, #fff, #88b8ff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-links {
    display: flex; gap: 28px;
    font-size: 14px; color: rgba(255,255,255,0.6);
    font-weight: 500;
  }
  .nav-links a {
    color: inherit; text-decoration: none;
    transition: color 0.2s;
    position: relative;
  }
  .nav-links a::after {
    content: ""; position: absolute;
    left: 0; right: 0; bottom: -6px;
    height: 1.5px;
    background: linear-gradient(90deg, #4a8dff, #8b5cf6);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s;
  }
  .nav-links a:hover { color: #fff; }
  .nav-links a:hover::after { transform: scaleX(1); }
  .nav-search {
    margin-left: auto;
    position: relative; flex: 0 0 280px;
  }
  .nav-search input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 11px 16px 11px 40px;
    color: #fff;
    font-family: inherit; font-size: 13px;
    outline: none;
    transition: all 0.2s;
  }
  .nav-search input:focus {
    border-color: #4a8dff;
    background: rgba(74,141,255,0.06);
    box-shadow: 0 0 0 4px rgba(74,141,255,0.1);
  }
  .nav-search::before {
    content: ""; position: absolute;
    left: 14px; top: 50%; transform: translateY(-50%);
    width: 14px; height: 14px;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a8b0c4' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/></svg>") no-repeat center / contain;
  }

  /* === CONTAINER === */
  .container { max-width: 1440px; margin: 0 auto; padding: 0 40px; }

  /* === REVEAL ANIMATIONS === */
  .reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.in {
    opacity: 1; transform: translateY(0);
  }
  .reveal-stagger > * {
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal-stagger.in > *:nth-child(1) { transition-delay: 0.05s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > *:nth-child(2) { transition-delay: 0.10s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > *:nth-child(3) { transition-delay: 0.15s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > *:nth-child(4) { transition-delay: 0.20s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > *:nth-child(5) { transition-delay: 0.25s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > *:nth-child(6) { transition-delay: 0.30s; opacity: 1; transform: translateY(0); }
  .reveal-stagger.in > * { opacity: 1; transform: translateY(0); }

  /* === HERO === */
  .hero {
    padding: 120px 0 100px;
    position: relative;
    min-height: 85vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .hero-canvas-wrap {
    position: absolute;
    inset: -120px 0 0 0;
    overflow: hidden;
    pointer-events: none;
    z-index: -1;
    mask-image: linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
  }
  #plejady-canvas {
    width: 100%; height: 100%;
    display: block;
  }
  .pleiades-label {
    position: absolute;
    top: 32px; right: 40px;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    text-align: right;
    line-height: 1.7;
    pointer-events: none;
    font-weight: 500;
  }
  .pleiades-label strong { color: #88b8ff; }
  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 900px;
  }
  .eyebrow {
    font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase;
    color: #88b8ff;
    margin-bottom: 32px;
    display: inline-flex; align-items: center; gap: 12px;
    padding: 6px 14px 6px 8px;
    background: rgba(74,141,255,0.1);
    border: 1px solid rgba(74,141,255,0.2);
    border-radius: 100px;
    font-weight: 600;
    backdrop-filter: blur(8px);
  }
  .eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #88b8ff;
    box-shadow: 0 0 10px #88b8ff;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  h1 {
    font-size: clamp(56px, 10vw, 144px);
    line-height: 0.85;
    letter-spacing: -0.045em;
    font-weight: 700;
    margin: 0;
  }
  h1 .l1 {
    display: block;
    background: linear-gradient(135deg, #fff 0%, #88b8ff 50%, #4a8dff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: gradient-shift 6s ease-in-out infinite;
    background-size: 200% 200%;
  }
  @keyframes gradient-shift {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .hero-sub {
    font-size: clamp(18px, 1.5vw, 24px);
    line-height: 1.5; color: rgba(255,255,255,0.7);
    margin: 40px 0 0;
    max-width: 720px;
    font-weight: 400;
  }
  .hero-cta {
    margin-top: 48px;
    display: flex; gap: 16px; flex-wrap: wrap;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 28px;
    border-radius: 12px;
    font-weight: 600; font-size: 15px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer; border: none; font-family: inherit;
    position: relative;
    overflow: hidden;
  }
  .btn-primary {
    background: linear-gradient(135deg, #4a8dff, #8b5cf6);
    color: #fff;
    box-shadow: 0 8px 32px rgba(74,141,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .btn-primary::before {
    content: ""; position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(74,141,255,0.55), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .btn-primary:hover::before { transform: translateX(100%); }
  .btn-ghost {
    background: rgba(255,255,255,0.04);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.24);
    transform: translateY(-2px);
  }

  /* === STATS === */
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-top: 72px;
    padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .stats > div {
    padding: 0 32px;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .stats > div:first-child { padding-left: 0; }
  .stats > div:last-child { border-right: none; padding-right: 0; }
  .stat-n {
    font-size: clamp(36px, 4vw, 56px);
    font-weight: 700; color: #fff;
    line-height: 1; font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff, #88b8ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .stat-l {
    color: rgba(255,255,255,0.5); font-size: 12px;
    margin-top: 12px; letter-spacing: 0.15em; text-transform: uppercase;
    font-weight: 500;
  }

  /* === SECTION === */
  .section { padding: 120px 0 0; }
  .section-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 48px;
    flex-wrap: wrap; gap: 20px;
  }
  .section-head h2 {
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 700;
    letter-spacing: -0.035em;
    margin: 0;
    line-height: 0.95;
    max-width: 900px;
  }
  .section-head h2 .num {
    display: inline-block;
    font-size: 14px; vertical-align: top;
    margin-right: 16px;
    font-weight: 600;
    color: #88b8ff;
    background: rgba(74,141,255,0.1);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(74,141,255,0.2);
    letter-spacing: 0.1em;
    line-height: 1;
    position: relative;
    top: 12px;
  }
  .section-head .sub {
    color: rgba(255,255,255,0.5);
    font-size: 15px;
    max-width: 360px;
    text-align: right;
  }

  /* === ROZCESTNÍK === */
  .rozcestnik {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .roz-card {
    position: relative;
    padding: 32px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    text-decoration: none; color: inherit;
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer;
    overflow: hidden;
  }
  .roz-card::before {
    content: ""; position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(74,141,255,0.06), transparent);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .roz-card:hover {
    border-color: rgba(74,141,255,0.4);
    transform: translateY(-6px);
    box-shadow: 0 24px 48px -16px rgba(74,141,255,0.25);
  }
  .roz-card:hover::before { opacity: 1; }
  .roz-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, rgba(74,141,255,0.15), rgba(139,92,246,0.1));
    border: 1px solid rgba(74,141,255,0.3);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    font-size: 22px;
    position: relative;
    transition: transform 0.4s;
  }
  .roz-card:hover .roz-icon { transform: scale(1.1) rotate(-5deg); }
  .roz-card h3 {
    font-size: 18px; margin: 0 0 8px;
    font-weight: 700; letter-spacing: -0.01em;
    position: relative;
  }
  .roz-card .count {
    font-size: 13px; color: rgba(255,255,255,0.5);
    position: relative;
    line-height: 1.5;
  }
  .roz-arrow {
    position: absolute; top: 28px; right: 28px;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
    opacity: 0;
    transition: all 0.3s;
  }
  .roz-card:hover .roz-arrow {
    opacity: 1;
    transform: translate(4px, -4px);
    background: rgba(74,141,255,0.2);
  }

  /* === HERO MODEL GRID === */
  .hero-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-rows: 280px 280px;
    gap: 16px;
  }
  .hero-card {
    position: relative;
    display: block; overflow: hidden;
    border-radius: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    text-decoration: none; color: inherit;
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s;
    will-change: transform;
    transform-style: preserve-3d;
  }
  .hero-card.main { grid-row: span 2; }
  .hero-card:hover { border-color: rgba(74,141,255,0.3); }
  .hero-card .ph { position: absolute; inset: 0; }
  .hero-card .ph img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.4s;
    filter: saturate(0.85);
  }
  .hero-card:hover .ph img { transform: scale(1.08); filter: saturate(1.1); }
  .hero-card .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(2,5,13,0.96) 0%, rgba(2,5,13,0.6) 30%, transparent 55%);
  }
  .hero-card .meta {
    position: absolute; bottom: 28px; left: 28px; right: 28px;
    transform: translateZ(20px);
  }
  .cat-tag {
    display: inline-block;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #88b8ff;
    padding: 5px 10px;
    background: rgba(74,141,255,0.12);
    border: 1px solid rgba(74,141,255,0.2);
    border-radius: 6px;
    margin-bottom: 12px;
    font-weight: 600;
    backdrop-filter: blur(8px);
  }
  .hero-card h2 {
    font-size: clamp(28px, 3vw, 40px); font-weight: 700;
    margin: 0 0 8px; letter-spacing: -0.025em; line-height: 1;
  }
  .hero-card.main h2 { font-size: clamp(40px, 5vw, 64px); }
  .hero-card .years {
    font-size: 14px; color: rgba(255,255,255,0.6);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  /* === CARD GLOW + SPOTLIGHT === */
  .card-glow {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
    z-index: -1;
    background: conic-gradient(from var(--glow-angle, 0deg), transparent 70%, #4a8dff, transparent);
    filter: blur(8px);
  }
  .hero-card:hover .card-glow, .card:hover .card-glow { opacity: 0.8; animation: rotate-glow 4s linear infinite; }
  @keyframes rotate-glow { to { --glow-angle: 360deg; } }
  @property --glow-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  .card-spotlight {
    position: absolute; inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(74,141,255,0.15), transparent 50%);
    transition: opacity 0.3s;
    z-index: 2;
  }
  .card:hover .card-spotlight, .hero-card:hover .card-spotlight { opacity: 1; }

  /* === FILTER BAR === */
  .filter-bar {
    display: flex; gap: 12px; align-items: center;
    flex-wrap: wrap;
    margin-bottom: 32px;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    backdrop-filter: blur(8px);
  }
  .chip {
    padding: 9px 16px;
    border-radius: 100px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  }
  .chip:hover {
    color: #fff;
    border-color: rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.06);
  }
  .chip.active {
    background: linear-gradient(135deg, #4a8dff, #8b5cf6);
    border-color: transparent;
    color: #fff;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(74,141,255,0.3);
  }
  .filter-search {
    flex: 1; min-width: 200px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    padding: 9px 18px;
    color: #fff;
    font-family: inherit; font-size: 13px;
    outline: none;
    transition: all 0.2s;
  }
  .filter-search:focus { border-color: rgba(74,141,255,0.4); background: rgba(74,141,255,0.04); }

  /* === MODEL GRID === */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .card {
    position: relative; display: block;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    text-decoration: none; color: inherit;
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, opacity 0.3s;
    will-change: transform;
    transform-style: preserve-3d;
  }
  .card.hidden { display: none; }
  .card:hover { border-color: rgba(74,141,255,0.3); }
  .card .ph { position: absolute; inset: 0; }
  .card .ph img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.4s;
    filter: saturate(0.85);
  }
  .card:hover .ph img { transform: scale(1.08); filter: saturate(1.1); }
  .card .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(2,5,13,0.95) 0%, rgba(2,5,13,0.5) 35%, transparent 55%);
  }
  .card .meta {
    position: absolute; bottom: 24px; left: 24px; right: 24px;
    transform: translateZ(15px);
  }
  .card h3 {
    font-size: 24px; font-weight: 700;
    margin: 0 0 6px; letter-spacing: -0.02em; line-height: 1;
  }
  .card .years { font-size: 13px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; font-weight: 500; }

  /* === COMMUNITY === */
  .phase-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.05));
    color: #ffb800;
    border: 1px solid rgba(255,184,0,0.3);
    border-radius: 100px;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-left: 12px;
    font-weight: 600;
  }
  .phase-badge::before { content: "•"; }
  .community-cta {
    display: grid; grid-template-columns: 2fr 1fr;
    gap: 40px;
    padding: 56px;
    background:
      linear-gradient(135deg, rgba(74,141,255,0.12) 0%, rgba(139,92,246,0.06) 100%),
      rgba(255,255,255,0.02);
    border: 1px solid rgba(74,141,255,0.2);
    border-radius: 24px;
    margin-bottom: 56px;
    position: relative;
    overflow: hidden;
  }
  .community-cta::before {
    content: ""; position: absolute;
    top: -100px; right: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(74,141,255,0.2) 0%, transparent 60%);
    filter: blur(40px);
    pointer-events: none;
  }
  .community-cta-text {
    position: relative;
  }
  .community-cta-text h3 {
    font-size: clamp(28px, 3vw, 42px); font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0 0 16px;
    line-height: 1.1;
  }
  .community-cta-text p {
    color: rgba(255,255,255,0.7);
    font-size: 16px; line-height: 1.6;
    margin: 0 0 28px;
    max-width: 460px;
  }
  .community-stats-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px;
    position: relative;
  }
  .cs-stat {
    padding: 20px;
    background: rgba(2,5,13,0.4);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    text-align: center;
    backdrop-filter: blur(12px);
  }
  .cs-n {
    font-size: 32px; font-weight: 700;
    background: linear-gradient(135deg, #fff, #88b8ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.025em;
    line-height: 1;
  }
  .cs-l {
    font-size: 11px; color: rgba(255,255,255,0.5);
    margin-top: 8px;
    letter-spacing: 0.1em; text-transform: uppercase;
    font-weight: 500;
  }
  .sub-section-title {
    font-size: 14px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    margin: 0 0 24px;
    color: rgba(255,255,255,0.5);
  }
  .community-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .user-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .user-card:hover {
    transform: translateY(-4px);
    border-color: rgba(74,141,255,0.3);
    box-shadow: 0 20px 40px -12px rgba(74,141,255,0.2);
  }
  .user-photo {
    aspect-ratio: 16/10;
    overflow: hidden;
    position: relative;
  }
  .user-photo img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s;
  }
  .user-card:hover .user-photo img { transform: scale(1.05); }
  .user-meta {
    padding: 20px 20px 12px;
    display: flex; align-items: center; gap: 14px;
  }
  .user-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a8dff, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(74,141,255,0.3);
  }
  .user-name {
    font-size: 14px; font-weight: 600;
    color: #fff;
  }
  .user-car {
    font-size: 12px; color: rgba(255,255,255,0.5);
    margin-top: 2px;
  }
  .user-story {
    margin: 0 20px 16px;
    font-size: 13px; line-height: 1.55;
    color: rgba(255,255,255,0.7);
  }
  .user-actions {
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex; gap: 20px;
    font-size: 12px; color: rgba(255,255,255,0.5);
    font-weight: 500;
  }

  /* === FORUM === */
  .forum-categories {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 40px;
  }
  .forum-cat {
    padding: 24px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .forum-cat::before {
    content: ""; position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(74,141,255,0.08), transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .forum-cat:hover {
    border-color: rgba(74,141,255,0.3);
    transform: translateY(-3px);
  }
  .forum-cat:hover::before { opacity: 1; }
  .forum-cat h4 {
    font-size: 15px; font-weight: 700;
    margin: 0 0 8px;
    color: #fff;
    position: relative;
  }
  .forum-cat-count {
    font-size: 12px; color: rgba(255,255,255,0.5);
    position: relative;
    font-weight: 500;
  }
  .forum-threads {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  .thread {
    display: flex; align-items: center; gap: 18px;
    padding: 20px 24px;
    text-decoration: none; color: inherit;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: all 0.2s;
  }
  .thread:last-child { border-bottom: none; }
  .thread:hover { background: rgba(74,141,255,0.04); padding-left: 32px; }
  .thread-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, rgba(74,141,255,0.15), rgba(139,92,246,0.1));
    border: 1px solid rgba(74,141,255,0.2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  .thread-main { flex: 1; min-width: 0; }
  .thread-title {
    font-size: 14px; font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .thread-meta {
    font-size: 11px; color: rgba(255,255,255,0.5);
    letter-spacing: 0.02em;
    font-weight: 500;
  }
  .thread-replies {
    font-size: 13px;
    color: #88b8ff;
    font-weight: 600;
    padding: 6px 14px;
    background: rgba(74,141,255,0.1);
    border: 1px solid rgba(74,141,255,0.2);
    border-radius: 100px;
    font-variant-numeric: tabular-nums;
  }
  .forum-cta {
    display: flex; gap: 14px; justify-content: flex-end;
    margin-top: 28px;
  }

  /* === HISTORY === */
  .history {
    padding: 160px 0 80px;
    position: relative;
  }
  .history-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: start;
  }
  .history-text h2 {
    font-size: clamp(40px, 5vw, 64px); font-weight: 700;
    letter-spacing: -0.035em; line-height: 1;
    margin: 0 0 40px;
  }
  .history-text h2 .accent {
    background: linear-gradient(135deg, #88b8ff, #8b5cf6);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .history-text p {
    font-size: 16px; line-height: 1.75; color: rgba(255,255,255,0.7);
    margin: 0 0 24px;
  }
  .history-text p:first-of-type::first-letter {
    font-size: 72px; font-weight: 700;
    float: left; line-height: 0.9;
    margin: 8px 14px 0 0;
    background: linear-gradient(135deg, #88b8ff, #8b5cf6);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .history-stats {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-top: 48px;
    padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .h-stat {
    padding: 20px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  .h-stat .h-stat-n {
    font-size: 36px; font-weight: 700;
    background: linear-gradient(135deg, #fff, #88b8ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.025em;
  }
  .h-stat .h-stat-l {
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    margin-top: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .history-image {
    aspect-ratio: 4/5;
    border-radius: 20px;
    overflow: hidden;
    background: #0a1428;
    position: relative;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 32px 80px -20px rgba(74,141,255,0.3);
  }
  .history-image img {
    width: 100%; height: 100%; object-fit: cover;
  }
  .history-image::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(74,141,255,0.15) 100%);
    mix-blend-mode: overlay;
  }

  /* === TIMELINE === */
  .timeline {
    padding: 80px 0 160px;
    position: relative;
  }
  .timeline-line {
    position: absolute;
    left: 50%; top: 180px; bottom: 120px;
    width: 2px;
    background: linear-gradient(to bottom,
      transparent 0%,
      rgba(74,141,255,0.6) 20%,
      rgba(139,92,246,0.6) 50%,
      rgba(255,184,0,0.6) 80%,
      transparent 100%);
    transform: translateX(-50%);
  }
  .timeline-events { position: relative; }
  .timeline-event {
    position: relative;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: center;
    margin-bottom: 72px;
  }
  .timeline-event:nth-child(even) .te-content { grid-column: 2; padding-left: 40px; }
  .timeline-event:nth-child(even) .te-spacer { grid-column: 1; }
  .timeline-event:nth-child(odd) .te-content { grid-column: 1; text-align: right; padding-right: 40px; }
  .timeline-event:nth-child(odd) .te-spacer { grid-column: 2; }
  .timeline-event::before {
    content: "";
    position: absolute; left: 50%; top: 24px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a8dff, #8b5cf6);
    transform: translateX(-50%);
    box-shadow: 0 0 0 6px rgba(74,141,255,0.15), 0 0 20px rgba(74,141,255,0.6);
    z-index: 2;
    transition: transform 0.3s;
  }
  .timeline-event:hover::before { transform: translateX(-50%) scale(1.3); }
  .te-year {
    font-size: clamp(48px, 6vw, 80px); font-weight: 700;
    background: linear-gradient(135deg, #88b8ff, #4a8dff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.04em;
    line-height: 0.9; margin-bottom: 16px;
    font-variant-numeric: tabular-nums;
  }
  .te-title {
    font-size: 24px; font-weight: 700;
    margin: 0 0 14px; letter-spacing: -0.015em;
  }
  .te-body {
    font-size: 14px; line-height: 1.65;
    color: rgba(255,255,255,0.65); max-width: 440px;
    margin: 0;
  }
  .timeline-event:nth-child(odd) .te-body { margin-left: auto; }

  /* === FOOTER === */
  footer {
    margin-top: 120px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 64px 0 32px;
    position: relative;
  }
  .footer-grid {
    max-width: 1440px; margin: 0 auto;
    padding: 0 40px;
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 40px;
  }
  footer h4 {
    font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.8); margin: 0 0 18px;
    font-weight: 600;
  }
  footer ul { list-style: none; }
  footer li {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 10px;
  }
  footer a {
    color: inherit; text-decoration: none;
    transition: color 0.2s;
  }
  footer a:hover { color: #fff; }
  .footer-brand-text {
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    line-height: 1.6;
    margin: 16px 0 0;
    max-width: 320px;
  }
  .footer-bottom {
    max-width: 1440px; margin: 48px auto 0;
    padding: 32px 40px 0;
    border-top: 1px solid rgba(255,255,255,0.04);
    font-size: 12px; color: rgba(255,255,255,0.4);
    display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }

  /* === RESPONSIVE === */
  @media (max-width: 1024px) {
    .stats { grid-template-columns: repeat(2, 1fr); gap: 16px 0; }
    .stats > div { padding: 16px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .stats > div:nth-child(2n) { border-right: none; }
    .stats > div:first-child { padding-left: 16px; }
    .stats > div:last-child { padding-right: 16px; }
  }
  @media (max-width: 900px) {
    .nav-inner { padding: 14px 20px; flex-wrap: wrap; gap: 16px; }
    .nav-links { font-size: 12px; gap: 16px; }
    .nav-search { flex: 1 0 100%; order: 3; }
    .container { padding: 0 20px; }
    .hero { padding: 64px 0 40px; min-height: auto; }
    .hero-sub { font-size: 16px; }
    .rozcestnik { grid-template-columns: 1fr 1fr; }
    .hero-grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(3, 300px);
    }
    .hero-card.main { grid-row: span 1; }
    .history-grid { grid-template-columns: 1fr; gap: 48px; }
    .timeline-line { left: 16px; }
    .timeline-event {
      grid-template-columns: 1fr;
      gap: 8px;
      padding-left: 48px;
    }
    .timeline-event::before { left: 16px; }
    .timeline-event:nth-child(odd) .te-content,
    .timeline-event:nth-child(even) .te-content {
      grid-column: 1; text-align: left; padding: 0;
    }
    .timeline-event .te-spacer { display: none; }
    .timeline-event:nth-child(odd) .te-body { margin-left: 0; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
    .community-cta { grid-template-columns: 1fr; padding: 32px; }
    .community-grid { grid-template-columns: 1fr; }
    .forum-categories { grid-template-columns: 1fr 1fr; }
    .section-head { flex-direction: column; align-items: flex-start; }
    .section-head .sub { text-align: left; }
  }
</style>
</head>
<body>
<div class="aurora">
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>
  <div class="blob blob-4"></div>
</div>
<div class="grid-overlay"></div>
<div class="grain"></div>
<div class="cursor-light"></div>

<!-- === NAVIGATION === -->
<nav class="nav">
  <div class="nav-inner">
    <a href="#" class="logo">
      <span class="logo-mark"></span>
      <span>Czech Subaru Club</span>
    </a>
    <div class="nav-links">
      <a href="#modely">Modely</a>
      <a href="#komunita">Komunita</a>
      <a href="#diskuze">Diskuze</a>
      <a href="#historie">Historie</a>
      <a href="#timeline">Timeline</a>
    </div>
    <div class="nav-search">
      <input type="search" id="search" placeholder="Hledat (Impreza, WRX, BRZ…)" autocomplete="off">
    </div>
  </div>
</nav>

<!-- === HERO === -->
<section class="container hero">
  <div class="hero-canvas-wrap">
    <canvas id="plejady-canvas"></canvas>
  </div>
  <div class="pleiades-label">
    <strong>Plejády · M45</strong><br>
    6 hvězd v logu Subaru<br>
    Souhvězdí Býka · 444 sv. let
  </div>

  <div class="hero-inner reveal in">
    <div class="eyebrow"><span class="eyebrow-dot"></span>Encyklopedie · Live</div>
    <h1>
      <span class="l1">Czech Subaru Club</span>
    </h1>
    <p class="hero-sub">Kompletní encyklopedie všech Subaru modelů od roku 1958. Boxer motory, symetrický pohon 4×4, rally heritage, JDM kei rarity.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#modely">Prozkoumat modely →</a>
      <a class="btn btn-ghost" href="#historie">O Subaru</a>
    </div>
    <div class="stats reveal-stagger">
      <div>
        <div class="stat-n" data-count="${rows.length}">0</div>
        <div class="stat-l">Modelů</div>
      </div>
      <div>
        <div class="stat-n" data-count="${cats.length}">0</div>
        <div class="stat-l">Kategorií</div>
      </div>
      <div>
        <div class="stat-n" data-count="67">0</div>
        <div class="stat-l">Let historie</div>
      </div>
      <div>
        <div class="stat-n">3×</div>
        <div class="stat-l">WRC titulů</div>
      </div>
    </div>
  </div>
</section>

<!-- === ROZCESTNÍK === -->
<section class="container section">
  <div class="section-head reveal">
    <h2><span class="num">01</span>Rozcestník</h2>
    <span class="sub">Co tě tu nejvíc zajímá?</span>
  </div>
  <div class="rozcestnik reveal-stagger">
    <a href="#modely" class="roz-card">
      <div class="roz-icon">🚗</div>
      <div class="roz-arrow">→</div>
      <h3>Všechny modely</h3>
      <div class="count">${rows.length} aut · sedan, SUV, kei, coupé, kombi</div>
    </a>
    <a href="#historie" class="roz-card">
      <div class="roz-icon">📜</div>
      <div class="roz-arrow">→</div>
      <h3>Historie firmy</h3>
      <div class="count">Od Nakajima Aircraft 1917<br>po Subaru Corporation</div>
    </a>
    <a href="#timeline" class="roz-card">
      <div class="roz-icon">⏳</div>
      <div class="roz-arrow">→</div>
      <h3>Timeline</h3>
      <div class="count">${HISTORY.length} klíčových milníků<br>1917–2022</div>
    </a>
    <a href="#komunita" class="roz-card">
      <div class="roz-icon">🏁</div>
      <div class="roz-arrow">→</div>
      <h3>Komunita</h3>
      <div class="count">Pochlub se autem<br>+ diskuze (Phase 6)</div>
    </a>
  </div>
</section>

<!-- === FEATURED MODELS === -->
<section class="container section">
  <div class="section-head reveal">
    <h2><span class="num">02</span>Top modely</h2>
    <span class="sub">Ikony značky — Impreza, WRX STI, BRZ</span>
  </div>
  <div class="hero-grid reveal-stagger">
    ${heroCard(heroes[0], "main")}
    ${heroes.slice(1).map((m) => heroCard(m, "side")).join("\n")}
  </div>
</section>

<!-- === ALL MODELS === -->
<section class="container section" id="modely">
  <div class="section-head reveal">
    <h2><span class="num">03</span>Všechny modely</h2>
    <span class="sub" id="filter-count">${rest.length} zobrazeno</span>
  </div>
  <div class="filter-bar reveal">
    <button class="chip active" data-cat="all">Vše (${rest.length})</button>
    ${cats.map((c) => `<button class="chip" data-cat="${c}">${CATEGORY_LABEL[c] ?? c} (${rest.filter((r) => r.category === c).length})</button>`).join("\n    ")}
    <input class="filter-search" id="filter-search" type="search" placeholder="Filtrovat podle názvu…">
  </div>
  <div class="grid reveal-stagger" id="model-grid">
    ${rest.map(card).join("\n")}
  </div>
</section>

<!-- === COMMUNITY === -->
<section class="container section" id="komunita">
  <div class="section-head reveal">
    <h2><span class="num">04</span>Pochlub se se svým Subaru<span class="phase-badge">Phase 6</span></h2>
    <span class="sub">Komunitní galerie · prozatím mockup</span>
  </div>
  <div class="community-cta reveal">
    <div class="community-cta-text">
      <h3>Máš Subaru? Ukaž ho světu.</h3>
      <p>Nahraj fotky tvého auta, napiš příběh, sdílej s komunitou. Garáž v noci, túra do hor, restorace JDM kei autíčka — všechno se tu hodí.</p>
      <a href="#" class="btn btn-primary">+ Přidat moje Subaru</a>
    </div>
    <div class="community-stats-grid">
      <div class="cs-stat">
        <div class="cs-n">0</div>
        <div class="cs-l">Sdílených aut</div>
      </div>
      <div class="cs-stat">
        <div class="cs-n">0</div>
        <div class="cs-l">Členů klubu</div>
      </div>
      <div class="cs-stat">
        <div class="cs-n">0</div>
        <div class="cs-l">Příběhů</div>
      </div>
      <div class="cs-stat">
        <div class="cs-n">∞</div>
        <div class="cs-l">Místa</div>
      </div>
    </div>
  </div>

  <h3 class="sub-section-title">Nedávno přidáno (mockup)</h3>
  <div class="community-grid reveal-stagger">
    ${rows.slice(0, 6).map((m, i) => {
      const names = ["Honza", "Tom", "Lucie", "Pavel", "Karel", "Eliška"];
      const cities = ["Praha", "Brno", "Plzeň", "Ostrava", "Hradec Králové", "Liberec"];
      const stories = [
        "Koupil 2018, prošla 4 sezónami rally simulátor + 1 reálná závodní událost na Sosnové.",
        "Daily driver, 180 000 km, zatím bez větších oprav. Boxer prostě jede.",
        "Restorace probíhající od roku 2021. Nový lak, repas motoru, originál interiér.",
        "Importováno z Japonska, RHD, naprostá rarita. Číslo 234 z 500.",
        "Servis pravidelně, výlet do Beskyd každý víkend. 4×4 nikdy nezklamalo.",
        "JDM kei náš mazlík. Bezpečně 90 km/h, na nákupy do města stačí.",
      ];
      return `<div class="user-card">
  <div class="user-photo">
    ${m.heroImageUrl ? `<img src="${m.heroImageUrl}" alt="${m.name}" loading="lazy">` : ""}
  </div>
  <div class="user-meta">
    <div class="user-avatar">${names[i][0]}</div>
    <div>
      <div class="user-name">${names[i]} · ${cities[i]}</div>
      <div class="user-car">${m.nameFull}, ${m.productionStart}</div>
    </div>
  </div>
  <p class="user-story">${stories[i]}</p>
  <div class="user-actions">
    <span>♡ ${Math.floor(Math.random() * 50) + 5}</span>
    <span>💬 ${Math.floor(Math.random() * 12)}</span>
  </div>
</div>`;
    }).join("\n")}
  </div>
</section>

<!-- === DISKUZE === -->
<section class="container section" id="diskuze">
  <div class="section-head reveal">
    <h2><span class="num">05</span>Diskuze<span class="phase-badge">Phase 6</span></h2>
    <span class="sub">Fórum o údržbě, tuningu, JDM lovu · mockup</span>
  </div>
  <div class="forum-categories reveal-stagger">
    <div class="forum-cat">
      <h4>Údržba & servis</h4>
      <div class="forum-cat-count">42 témat · 387 příspěvků</div>
    </div>
    <div class="forum-cat">
      <h4>Tuning & úpravy</h4>
      <div class="forum-cat-count">28 témat · 256 příspěvků</div>
    </div>
    <div class="forum-cat">
      <h4>JDM import & lov</h4>
      <div class="forum-cat-count">19 témat · 134 příspěvků</div>
    </div>
    <div class="forum-cat">
      <h4>Rally & motorsport</h4>
      <div class="forum-cat-count">15 témat · 98 příspěvků</div>
    </div>
  </div>

  <h3 class="sub-section-title">Aktivní vlákna</h3>
  <div class="forum-threads reveal">
    ${[
      ["EJ207 → EJ257 přestavba — co řešit?", "Tuning", "Pavel K.", 23, "před 2h"],
      ["Hledám originální díly na Alcyone XT 1989", "JDM", "Honza B.", 8, "před 5h"],
      ["Subaru Sambar — výhody/nevýhody jako daily?", "Údržba", "Lucie M.", 17, "včera"],
      ["WRC 1995 livery — vinyl wrap nebo postřik?", "Tuning", "Tomáš V.", 31, "včera"],
      ["Forester SH AWD bad — diagnostika?", "Údržba", "Karel S.", 12, "2 dny"],
      ["Komu se podařil import z Japonska 2025?", "JDM", "Eliška N.", 24, "3 dny"],
    ].map(([title, cat, author, replies, time]) => `<a href="#" class="thread">
  <div class="thread-icon">💬</div>
  <div class="thread-main">
    <div class="thread-title">${title}</div>
    <div class="thread-meta">${cat} · ${author} · ${time}</div>
  </div>
  <div class="thread-replies">${replies}</div>
</a>`).join("\n")}
  </div>
  <div class="forum-cta">
    <a href="#" class="btn btn-ghost">Všechna vlákna →</a>
    <a href="#" class="btn btn-primary">+ Nové téma</a>
  </div>
</section>

<!-- === HISTORIE === -->
<section class="container history" id="historie">
  <div class="history-grid reveal">
    <div class="history-text">
      <h2>Subaru — <span class="accent">znamená sjednocení</span></h2>
      <p>Jméno „Subaru\" je japonský výraz pro souhvězdí Plejády a odráží sjednocení šesti firem, ze kterých Fuji Heavy Industries v roce 1953 vznikla. Šest hvězd v logu — pět menších plus jedna velká — symbolizuje tuto fúzi.</p>
      <p>Příběh ale začíná dřív. V roce 1917 vzniká Nakajima Aircraft Company, výrobce stíhaček pro japonskou armádu (Ki-43 Hayabusa, Ki-84 Hayate). Po druhé světové válce byla rozdělena na 12 firem. Pět z nich se v roce 1953 sloučilo zpět do FHI. Inženýr Kenji Kita prosadil přechod z výroby skútrů na auta — a tak vzniká roku 1958 první Subaru: kei mikrokar 360 s 16 koňmi a tvarem brouka.</p>
      <p>Šedesátá léta přinesla průlomy. Subaru 1000 (1966) byl první japonský sériový vůz s kombinací Boxer motoru a předního pohonu. Leone (1972) přidal symetrický pohon 4×4 — a tím definoval DNA, které Subaru drží dodnes.</p>
      <p>V osmdesátých a devadesátých letech vstupuje Subaru do rally. Impreza WRX se stává symbolem Group A éry: Colin McRae bere mistrovský titul roku 1995, manufacturer titul jde do Japonska třikrát v řadě. Modrá stříbrná livery 555 je dnes ikonická.</p>
      <p>V roce 2017 se Fuji Heavy Industries přejmenovává na Subaru Corporation. Auta tvoří víc než 60 % byznysu. V roce 2022 přichází Solterra — první plně elektrické Subaru, společný projekt s Toyotou. AWD samozřejmě zachováno.</p>
      <div class="history-stats">
        <div class="h-stat">
          <div class="h-stat-n">1917</div>
          <div class="h-stat-l">Nakajima Aircraft</div>
        </div>
        <div class="h-stat">
          <div class="h-stat-n">1953</div>
          <div class="h-stat-l">FHI vzniká</div>
        </div>
        <div class="h-stat">
          <div class="h-stat-n">1972</div>
          <div class="h-stat-l">První AWD osobák</div>
        </div>
        <div class="h-stat">
          <div class="h-stat-n">2017</div>
          <div class="h-stat-l">Subaru Corp.</div>
        </div>
      </div>
    </div>
    <div class="history-image">
      ${rows.find((r) => r.slug === "wrx-sti")?.heroImageUrl ? `<img src="${rows.find((r) => r.slug === "wrx-sti")?.heroImageUrl}" alt="Subaru WRX STI">` : ""}
    </div>
  </div>
</section>

<!-- === TIMELINE === -->
<section class="container timeline" id="timeline">
  <div class="section-head reveal">
    <h2><span class="num">06</span>Klíčové milníky</h2>
    <span class="sub">${HISTORY.length} událostí od roku 1917</span>
  </div>
  <div class="timeline-line"></div>
  <div class="timeline-events">
    ${HISTORY.map((e) => `<div class="timeline-event reveal">
  <div class="te-content">
    <div class="te-year">${e.year}</div>
    <h3 class="te-title">${e.title}</h3>
    <p class="te-body">${e.body}</p>
  </div>
  <div class="te-spacer"></div>
</div>`).join("\n")}
  </div>
</section>

<!-- === FOOTER === -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="logo">
        <span class="logo-mark"></span>
        <span>Czech Subaru Club</span>
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
        <li><a href="#">Rally heritage</a></li>
      </ul>
    </div>
    <div>
      <h4>Kategorie</h4>
      <ul>
        ${cats.map((c) => `<li><a href="#modely">${CATEGORY_LABEL[c] ?? c}</a></li>`).join("\n")}
      </ul>
    </div>
    <div>
      <h4>Provozovatel</h4>
      <ul>
        <li>Samec Digital s.r.o.</li>
        <li>IČO 29547539</li>
        <li><a href="mailto:info@samecdigital.com">info@samecdigital.com</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} Samec Digital s.r.o. · Všechna práva vyhrazena.</span>
    <span>Made with Boxer ❤ in Czechia</span>
  </div>
</footer>

<script>
  // === PLEJÁDY CANVAS ===
  (function() {
    const canvas = document.getElementById('plejady-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pleiades = [
      { x: 0.62, y: 0.42, mag: 1.0 },
      { x: 0.55, y: 0.55, mag: 0.85 },
      { x: 0.48, y: 0.38, mag: 0.8 },
      { x: 0.70, y: 0.32, mag: 0.7 },
      { x: 0.74, y: 0.55, mag: 0.65 },
      { x: 0.41, y: 0.48, mag: 0.6 },
    ];
    const dust = [];

    function regenDust() {
      dust.length = 0;
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < count; i++) {
        dust.push({
          x: Math.random(), y: Math.random(),
          r: Math.random() * 1.3 + 0.2,
          phase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * 0.00003,
          driftY: (Math.random() - 0.5) * 0.00001,
        });
      }
    }
    function resize() {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      regenDust();
    }
    resize();
    window.addEventListener('resize', resize);

    let t0 = performance.now();
    function tick(now) {
      const t = (now - t0) / 1000;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const s of dust) {
        s.x += s.driftX; s.y += s.driftY;
        if (s.x < 0) s.x += 1; else if (s.x > 1) s.x -= 1;
        if (s.y < 0) s.y += 1; else if (s.y > 1) s.y -= 1;
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (twinkle * 0.55).toFixed(3) + ')';
        ctx.fill();
      }

      for (const p of pleiades) {
        const cx = p.x * w, cy = p.y * h;
        const radius = 2 + p.mag * 2.5;
        const twinkle = 0.85 + 0.15 * Math.sin(t * 1.5 + p.x * 10);
        const intensity = p.mag * twinkle;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 18);
        grad.addColorStop(0, 'rgba(180, 210, 255, ' + (0.65 * intensity).toFixed(3) + ')');
        grad.addColorStop(0.15, 'rgba(120, 160, 255, ' + (0.28 * intensity).toFixed(3) + ')');
        grad.addColorStop(0.4, 'rgba(74, 141, 255, ' + (0.1 * intensity).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(74, 141, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius * 18, cy - radius * 18, radius * 36, radius * 36);

        ctx.strokeStyle = 'rgba(220, 235, 255, ' + (0.55 * intensity).toFixed(3) + ')';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(cx - radius * 12, cy); ctx.lineTo(cx + radius * 12, cy);
        ctx.moveTo(cx, cy - radius * 12); ctx.lineTo(cx, cy + radius * 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + intensity.toFixed(3) + ')';
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(74,141,255,0.08)';
      ctx.lineWidth = 1;
      const connections = [[0,1],[0,2],[0,3],[0,4],[2,5],[1,4]];
      for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(pleiades[a].x * w, pleiades[a].y * h);
        ctx.lineTo(pleiades[b].x * w, pleiades[b].y * h);
        ctx.stroke();
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // === CURSOR SPOTLIGHT ===
  (function() {
    const light = document.querySelector('.cursor-light');
    if (!light || !window.matchMedia('(hover: hover)').matches) return;
    let x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      light.style.opacity = '1';
    });
    function loop() {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      light.style.left = x + 'px';
      light.style.top = y + 'px';
      requestAnimationFrame(loop);
    }
    loop();
  })();

  // === 3D CARD TILT ===
  (function() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        const rx = ((y - cy) / cy) * -4;
        const ry = ((x - cx) / cx) * 4;
        card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)';
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  })();

  // === REVEAL ON SCROLL ===
  (function() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '-50px 0px' });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
  })();

  // === COUNTER ANIMATION ===
  (function() {
    const counters = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const target = parseInt(el.dataset.count, 10);
          const dur = 1400;
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
