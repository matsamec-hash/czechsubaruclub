import { listModels } from "@/lib/data/models";
import { ModelsCatalog } from "./(components)/ModelsCatalog";
import { CountUp } from "./(components)/CountUp";
import { Reveal } from "./(components)/Reveal";
import { HomeQuizBlock } from "./(components)/HomeQuizBlock";

const HISTORY = [
  {
    year: 1917,
    title: "Nakajima Aircraft",
    body: "Kořeny Subaru. Nakajima vyrábí stíhačky pro japonskou armádu.",
  },
  {
    year: 1953,
    title: "Fuji Heavy Industries",
    body: "Pět z dvanácti pováleckých firem se spojuje zpět do FHI.",
  },
  {
    year: 1958,
    title: "Subaru 360",
    body: "První produkční auto — kei mikrokar, 16 koní. Vyráběl se 12 let.",
  },
  {
    year: 1966,
    title: "Subaru 1000",
    body: "První japonský sériový vůz s Boxer motorem a předním pohonem.",
  },
  {
    year: 1972,
    title: "Leone 4WD",
    body: "První masově vyráběné osobní auto s pohonem 4×4 na světě.",
  },
  {
    year: 1989,
    title: "Legacy",
    body: "Premium sedan/kombi pro export. Symbol spolehlivosti.",
  },
  {
    year: 1992,
    title: "Impreza",
    body: "Kompaktní platforma co položí WRC rally legendu.",
  },
  {
    year: 1995,
    title: "Colin McRae mistr světa",
    body: "WRC titul. Subaru bere konstruktérský titul ve třech letech v řadě.",
  },
  {
    year: 2012,
    title: "BRZ",
    body: "Lehký RWD coupé s FA20 Boxerem — pure driver's car bez turba.",
  },
  {
    year: 2017,
    title: "Subaru Corp.",
    body: "FHI se přejmenovává na Subaru Corporation.",
  },
  {
    year: 2022,
    title: "Solterra — první EV",
    body: "Plně elektrické Subaru. AWD zachováno.",
  },
];

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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Czech Subaru Club",
  alternateName: "CzechSubaruClub",
  url: "https://czechsubaruclub.cz",
  inLanguage: "cs-CZ",
  description:
    "Kompletní česká encyklopedie všech modelů Subaru od roku 1958. Boxer motory, symetrický pohon 4×4, rally heritage, JDM kei rarity.",
  publisher: {
    "@type": "Organization",
    name: "Samec Digital s.r.o.",
    url: "https://samecdigital.com",
    email: "info@samecdigital.com",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://czechsubaruclub.cz/hledat?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Czech Subaru Club",
  url: "https://czechsubaruclub.cz",
  logo: "https://czechsubaruclub.cz/og-default.png",
  description:
    "Czech Subaru Club — nezávislá encyklopedie všech modelů Subaru v češtině.",
  founder: {
    "@type": "Organization",
    name: "Samec Digital s.r.o.",
    identifier: "29547539",
  },
};

async function fetchModels() {
  return listModels().map((m) => ({
    slug: m.slug,
    name: m.name,
    nameFull: m.nameFull,
    category: m.category,
    productionStart: m.productionStart,
    productionEnd: m.productionEnd,
    heroImageUrl: m.heroImageUrl,
    wikidataQid: m.wikidataQid,
  }));
}

const FAKE_USERS = [
  {
    name: "Honza",
    city: "Praha",
    story:
      "Koupil 2018, 4 sezóny rally simulátor + 1 reálná na Sosnové.",
  },
  {
    name: "Tom",
    city: "Brno",
    story: "Daily driver, 180 000 km, bez větších oprav. Boxer prostě jede.",
  },
  {
    name: "Lucie",
    city: "Plzeň",
    story:
      "Restorace od 2021. Nový lak, repas motoru, originál interiér.",
  },
  {
    name: "Pavel",
    city: "Ostrava",
    story: "Import z Japonska, RHD, naprostá rarita. Číslo 234 z 500.",
  },
  {
    name: "Karel",
    city: "Hradec",
    story: "Servis pravidelně, výlet do Beskyd. 4×4 nikdy nezklamalo.",
  },
  {
    name: "Eliška",
    city: "Liberec",
    story: "JDM kei mazlík. 90 km/h max, na nákupy stačí.",
  },
];

const FORUM_THREADS = [
  {
    title: "EJ207 → EJ257 přestavba — co řešit?",
    cat: "Tuning",
    author: "Pavel K.",
    replies: 23,
    time: "2h",
  },
  {
    title: "Hledám díly na Alcyone XT 1989",
    cat: "JDM",
    author: "Honza B.",
    replies: 8,
    time: "5h",
  },
  {
    title: "Sambar — výhody/nevýhody jako daily?",
    cat: "Údržba",
    author: "Lucie M.",
    replies: 17,
    time: "včera",
  },
  {
    title: "WRC 1995 livery — vinyl nebo postřik?",
    cat: "Tuning",
    author: "Tomáš V.",
    replies: 31,
    time: "včera",
  },
  {
    title: "Forester SH AWD bad — diagnostika?",
    cat: "Údržba",
    author: "Karel S.",
    replies: 12,
    time: "2 d",
  },
  {
    title: "Komu se podařil import z Japonska 2025?",
    cat: "JDM",
    author: "Eliška N.",
    replies: 24,
    time: "3 d",
  },
];

export default async function HomePage() {
  const models = await fetchModels();
  const heroes = models.filter((m) =>
    ["impreza", "wrx-sti", "brz"].includes(m.slug),
  );
  const heroSlugs = new Set(heroes.map((h) => h.slug));
  const rest = models.filter((m) => !heroSlugs.has(m.slug));
  const wrxSti = models.find((m) => m.slug === "wrx-sti");
  const userModels = models.slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      {/* === HERO === */}
      <section className="relative overflow-hidden isolate">
        <div className="absolute inset-0 -z-10">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={wrxSti?.heroImageUrl ?? undefined}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          >
            <source
              src="https://videos.pexels.com/video-files/16768844/16768844-hd_1280_720_60fps.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-[#0a0a0c]/70 to-[#0a0a0c]" />
        </div>
        <div className="mx-auto max-w-7xl px-8 pt-32 pb-40 relative">
        <div className="reveal in">
          <div className="inline-flex items-center gap-2 text-[12px] text-white/60 font-medium mb-10">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4a8dff]"
              style={{ boxShadow: "0 0 8px #4a8dff" }}
            />
            Encyklopedie · {models.length} modelů
          </div>
          <h1 className="text-[clamp(56px,9vw,144px)] font-semibold tracking-[-0.045em] leading-[0.92] text-white max-w-[1000px]">
            Czech Subaru Club{" "}
            <em className="not-italic font-normal font-serif italic">
              Encyklopedie
            </em>{" "}
            všech Subaru.
          </h1>
          <p className="mt-10 text-[clamp(17px,1.4vw,21px)] text-white/60 max-w-[600px] leading-relaxed">
            Kompletní katalog modelů a generací od roku 1958 — Boxer motory,
            symetrický pohon 4×4, rally heritage, JDM kei rarity.
          </p>
          <div className="mt-14 flex gap-3 flex-wrap items-center">
            <a
              href="#modely"
              className="inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-full text-[14px] font-medium bg-white text-black hover:bg-[#4a8dff] hover:text-white transition"
            >
              Prozkoumat modely
            </a>
            <a
              href="#historie"
              className="inline-flex items-center gap-1 text-[14px] text-white/60 hover:text-white transition group"
            >
              O Subaru
              <span className="transition-all group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        <Reveal className="mt-24 pt-8 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-y-4">
          <div className="md:pr-8 md:border-r md:border-white/[0.06]">
            <div className="text-[28px] font-medium tracking-tight tabular-nums text-white leading-none">
              <CountUp to={models.length} />
            </div>
            <div className="text-[12px] text-white/40 mt-2">Modelů</div>
          </div>
          <div className="md:px-8 md:border-r md:border-white/[0.06]">
            <div className="text-[28px] font-medium tracking-tight tabular-nums text-white leading-none">
              <CountUp
                to={Array.from(new Set(models.map((m) => m.category))).length}
              />
            </div>
            <div className="text-[12px] text-white/40 mt-2">Kategorií</div>
          </div>
          <div className="md:px-8 md:border-r md:border-white/[0.06]">
            <div className="text-[28px] font-medium tracking-tight tabular-nums text-white leading-none">
              <CountUp to={67} />
            </div>
            <div className="text-[12px] text-white/40 mt-2">Let historie</div>
          </div>
          <div className="md:pl-8">
            <div className="text-[28px] font-medium tracking-tight tabular-nums text-white leading-none">
              3×
            </div>
            <div className="text-[12px] text-white/40 mt-2">WRC titulů</div>
          </div>
        </Reveal>
        </div>
      </section>

      <HomeQuizBlock />

      {/* === ROZCESTNÍK === */}
      <section className="pt-32">
        <div className="mx-auto max-w-7xl px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
            <div>
              <div className="text-[12px] text-white/40 mb-4">
                01 — Rozcestník
              </div>
              <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
                Co tě tu{" "}
                <em className="not-italic font-normal font-serif italic">
                  nejvíc zajímá?
                </em>
              </h2>
            </div>
            <span className="text-[14px] text-white/40 max-w-[300px] md:text-right">
              Vyber si, kam tě to táhne.
            </span>
          </Reveal>
        </div>
        <Reveal className="grid md:grid-cols-4 border-y border-white/[0.06]">
          {[
            {
              href: "#modely",
              num: "01",
              title: "Modely",
              count: `${models.length} aut · sedan, SUV, kei, coupé, kombi`,
            },
            {
              href: "#historie",
              num: "02",
              title: "Historie firmy",
              count: "Od Nakajima Aircraft 1917 po Subaru Corp.",
            },
            {
              href: "#timeline",
              num: "03",
              title: "Timeline",
              count: `${HISTORY.length} klíčových milníků`,
            },
            {
              href: "#komunita",
              num: "04",
              title: "Komunita",
              count: "Pochlub se autem + diskuze",
            },
          ].map((c, i, arr) => (
            <a
              key={c.num}
              href={c.href}
              className={`relative block p-10 transition hover:bg-white/[0.02] ${
                i < arr.length - 1
                  ? "md:border-r md:border-white/[0.06]"
                  : ""
              } ${i > 0 ? "border-t md:border-t-0 border-white/[0.06]" : ""}`}
            >
              <span className="block text-[11px] text-white/40 tracking-wider mb-14">
                {c.num}
              </span>
              <h3 className="text-[20px] font-medium tracking-tight mb-2 text-white">
                {c.title}
              </h3>
              <div className="text-[13px] text-white/60 leading-relaxed">
                {c.count}
              </div>
              <span className="absolute bottom-8 right-8 text-white/40 transition group-hover:text-white">
                →
              </span>
            </a>
          ))}
        </Reveal>
      </section>

      {/* === BENTO TOP MODELS === */}
      {heroes.length === 3 && (
        <section className="mx-auto max-w-7xl px-8 pt-32">
          <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
            <div>
              <div className="text-[12px] text-white/40 mb-4">
                02 — Top modely
              </div>
              <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
                <em className="not-italic font-normal font-serif italic">
                  Ikony
                </em>{" "}
                značky.
              </h2>
            </div>
            <span className="text-[14px] text-white/40 max-w-[300px] md:text-right">
              Tři hero modely — Impreza, WRX STI, BRZ.
            </span>
          </Reveal>
          <Reveal className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[360px_280px] gap-2">
            <BentoCard m={heroes[0]} size="lg" />
            <BentoCard m={heroes[1]} size="md" />
            <BentoCard m={heroes[2]} size="md" />
            <div className="bg-[#131316] rounded flex items-center justify-center text-center p-8">
              <div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider mb-3">
                  a dalších
                </div>
                <div className="text-[56px] font-medium text-white tracking-tight leading-none">
                  {rest.length}
                </div>
                <div className="text-[13px] text-white/60 mt-2">
                  modelů níže ↓
                </div>
              </div>
            </div>
            <div className="bg-[#131316] rounded flex items-center justify-center text-center p-8">
              <div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider mb-3">
                  Boxer motorů
                </div>
                <div className="text-[56px] font-normal text-[#4a8dff] tracking-tight leading-none font-serif italic">
                  ∞
                </div>
                <div className="text-[13px] text-white/60 mt-2">
                  flat-four DNA
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* === MODELS CATALOG === */}
      <section id="modely" className="mx-auto max-w-7xl px-8 pt-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
          <div>
            <div className="text-[12px] text-white/40 mb-4">03 — Katalog</div>
            <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
              Všechny{" "}
              <em className="not-italic font-normal font-serif italic">
                modely.
              </em>
            </h2>
          </div>
        </Reveal>
        {models.length === 0 ? (
          <div className="text-center text-white/40 py-32 text-[14px]">
            Modely se načítají…
          </div>
        ) : (
          <ModelsCatalog models={rest} />
        )}
      </section>

      {/* === KOMUNITA === */}
      <section id="komunita" className="mx-auto max-w-7xl px-8 pt-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
          <div>
            <div className="text-[12px] text-white/40 mb-4">
              04 — Komunita
              <span className="inline-block ml-3 px-2 py-0.5 bg-[#4a8dff]/10 text-[#4a8dff] text-[10px] uppercase tracking-wider rounded font-medium align-middle">
                Phase 6
              </span>
            </div>
            <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
              Pochlub se se svým{" "}
              <em className="not-italic font-normal font-serif italic">
                Subaru.
              </em>
            </h2>
          </div>
          <span className="text-[14px] text-white/40 max-w-[300px] md:text-right">
            Galerie uživatelů — mockup.
          </span>
        </Reveal>
        <Reveal className="mb-14">
          <div className="bg-[#131316] rounded-2xl p-14 grid md:grid-cols-[1.5fr_1fr] gap-14 items-center">
            <div>
              <h3 className="text-[clamp(24px,2.4vw,36px)] font-medium tracking-[-0.025em] leading-tight mb-4 text-white">
                Máš Subaru? Ukaž ho světu.
              </h3>
              <p className="text-[15px] text-white/60 leading-relaxed max-w-[480px] mb-7">
                Nahraj fotky tvého auta, napiš příběh, sdílej s komunitou.
                Garáž, túra, restorace JDM — všechno se hodí.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-full text-[14px] font-medium bg-white text-black hover:bg-[#4a8dff] hover:text-white transition"
              >
                Přidat moje Subaru
              </a>
            </div>
            <div className="border-t border-white/[0.06]">
              {[
                ["Sdílených aut", "0"],
                ["Členů klubu", "0"],
                ["Příběhů", "0"],
                ["Místa", "∞"],
              ].map(([label, value], i, arr) => (
                <div
                  key={label}
                  className={`flex justify-between py-4 ${
                    i < arr.length - 1 ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <span className="text-[13px] text-white/60">{label}</span>
                  <span className="text-[16px] font-medium text-white tabular-nums">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {userModels.map((m, i) => {
            const user = FAKE_USERS[i];
            if (!user) return null;
            return (
              <div
                key={m.slug}
                className="bg-[#131316] rounded-lg overflow-hidden transition hover:-translate-y-0.5"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  {m.heroImageUrl && (
                    <img
                      src={m.heroImageUrl}
                      alt={m.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#4a8dff] flex items-center justify-center text-[13px] font-medium text-white">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        {user.city} · {m.nameFull}, {m.productionStart}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed mb-3">
                    {user.story}
                  </p>
                  <div className="flex gap-4 text-[12px] text-white/40">
                    <span>♡ {Math.floor((i + 1) * 7.3) + 5}</span>
                    <span>💬 {(i + 1) * 2}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </section>

      {/* === DISKUZE === */}
      <section id="diskuze" className="mx-auto max-w-7xl px-8 pt-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
          <div>
            <div className="text-[12px] text-white/40 mb-4">
              05 — Fórum
              <span className="inline-block ml-3 px-2 py-0.5 bg-[#4a8dff]/10 text-[#4a8dff] text-[10px] uppercase tracking-wider rounded font-medium align-middle">
                Phase 6
              </span>
            </div>
            <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
              <em className="not-italic font-normal font-serif italic">
                Diskuze.
              </em>
            </h2>
          </div>
          <span className="text-[14px] text-white/40 max-w-[300px] md:text-right">
            Údržba, tuning, JDM lov — mockup.
          </span>
        </Reveal>
        <Reveal className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {[
            ["Údržba & servis", "42 témat"],
            ["Tuning & úpravy", "28 témat"],
            ["JDM import & lov", "19 témat"],
            ["Rally & motorsport", "15 témat"],
          ].map(([title, count]) => (
            <div
              key={title}
              className="p-6 bg-[#131316] rounded-lg transition hover:bg-[#1a1a1e]"
            >
              <h4 className="text-[14px] font-medium text-white mb-1.5">
                {title}
              </h4>
              <div className="text-[12px] text-white/40">{count}</div>
            </div>
          ))}
        </Reveal>
        <Reveal>
          <div className="bg-[#131316] rounded-lg overflow-hidden">
            {FORUM_THREADS.map((t, i, arr) => (
              <a
                key={t.title}
                href="#"
                className={`flex items-center gap-4 px-6 py-5 transition hover:bg-[#1a1a1e] ${
                  i < arr.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-white mb-1 truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {t.cat} · {t.author} · před {t.time}
                  </div>
                </div>
                <div className="text-[12px] text-white/60 tabular-nums whitespace-nowrap">
                  {t.replies} odp.
                </div>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      {/* === HISTORIE === */}
      <section id="historie" className="mx-auto max-w-7xl px-8 pt-48 pb-24">
        <Reveal>
          <div className="text-[12px] text-white/40 mb-4">06 — Background</div>
        </Reveal>
        <Reveal className="grid md:grid-cols-2 gap-20">
          <div>
            <h2 className="text-[clamp(40px,5vw,64px)] font-medium tracking-[-0.035em] leading-none mb-12 text-white">
              Subaru znamená{" "}
              <em className="not-italic font-normal font-serif italic text-[#88b8ff]">
                sjednocení.
              </em>
            </h2>
            <div className="text-[16px] text-white/60 leading-[1.7] space-y-5">
              <p>
                Jméno „Subaru&quot; je japonský výraz pro souhvězdí{" "}
                <strong className="text-white font-medium">Plejády</strong> a
                odráží sjednocení šesti firem, ze kterých Fuji Heavy Industries
                v roce 1953 vznikla. Šest hvězd v logu — pět menších plus jedna
                velká — symbolizuje tuto fúzi.
              </p>
              <p>
                Příběh ale začíná dřív. V roce{" "}
                <strong className="text-white font-medium">1917</strong> vzniká
                Nakajima Aircraft Company, výrobce stíhaček pro japonskou
                armádu. Po druhé světové válce byla rozdělena na 12 firem. Pět
                z nich se v roce{" "}
                <strong className="text-white font-medium">1953</strong>{" "}
                sloučilo zpět do FHI.
              </p>
              <p>
                Šedesátá léta přinesla průlomy. Subaru 1000 (1966) byl první
                japonský sériový vůz s kombinací Boxer motoru a předního
                pohonu. Leone (1972) přidal symetrický pohon 4×4 — a tím
                definoval DNA, které Subaru drží dodnes.
              </p>
              <p>
                V devadesátých letech vstupuje Subaru do rally.{" "}
                <strong className="text-white font-medium">Colin McRae</strong>{" "}
                bere mistrovský titul roku 1995, manufacturer titul jde do
                Japonska třikrát v řadě. Modrá stříbrná livery 555 je dnes
                ikonická.
              </p>
              <p>
                V roce{" "}
                <strong className="text-white font-medium">2017</strong> se
                Fuji Heavy Industries přejmenovává na Subaru Corporation. V
                roce 2022 přichází Solterra — první plně elektrické Subaru.
                AWD samozřejmě zachováno.
              </p>
            </div>
          </div>
          <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#131316] md:sticky md:top-24 md:self-start">
            {wrxSti?.heroImageUrl && (
              <img
                src={wrxSti.heroImageUrl}
                alt="Subaru WRX STI"
                className="w-full h-full object-cover brightness-90"
              />
            )}
          </div>
        </Reveal>
      </section>

      {/* === TIMELINE === */}
      <section id="timeline" className="mx-auto max-w-7xl px-8 pb-48">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-14">
          <div>
            <div className="text-[12px] text-white/40 mb-4">
              07 — Chronologie
            </div>
            <h2 className="text-[clamp(36px,4.5vw,56px)] font-medium tracking-[-0.035em] leading-none text-white">
              <em className="not-italic font-normal font-serif italic">
                Klíčové
              </em>{" "}
              milníky.
            </h2>
          </div>
          <span className="text-[14px] text-white/40 max-w-[300px] md:text-right">
            {HISTORY.length} událostí · 1917 → 2022.
          </span>
        </Reveal>
        <Reveal>
          <div className="border-t border-white/[0.06]">
            {HISTORY.map((e) => (
              <div
                key={e.year}
                className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] gap-6 md:gap-10 py-8 border-b border-white/[0.06] transition hover:bg-white/[0.02] items-baseline"
              >
                <div className="text-[24px] font-medium text-[#4a8dff] tabular-nums tracking-tight">
                  {e.year}
                </div>
                <div className="max-w-[560px]">
                  <h3 className="text-[18px] font-medium tracking-tight text-white mb-1.5">
                    {e.title}
                  </h3>
                  <p className="text-[14px] text-white/60 leading-relaxed">
                    {e.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}

// === BENTO CARD ===
function BentoCard({
  m,
  size,
}: {
  m: {
    slug: string;
    name: string;
    category: string;
    productionStart: number | null;
    productionEnd: number | null;
    heroImageUrl: string | null;
    wikidataQid: string | null;
  };
  size: "lg" | "md" | "sm";
}) {
  const years =
    m.productionStart && m.productionEnd
      ? `${m.productionStart}–${m.productionEnd}`
      : m.productionStart
        ? `od ${m.productionStart}`
        : "";
  const sizeClass = size === "lg" ? "md:row-span-2" : "";
  const titleSize = size === "lg" ? "text-[clamp(40px,5vw,64px)]" : "text-[28px]";

  return (
    <a
      href={`/modely/${m.slug}`}
      className={`relative block overflow-hidden rounded bg-[#131316] group ${sizeClass}`}
    >
      {m.heroImageUrl && (
        <img
          src={m.heroImageUrl}
          alt={m.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 brightness-[0.85] group-hover:brightness-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/85 via-[#0a0a0c]/10 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1">
          {CATEGORY_LABEL[m.category] ?? m.category}
        </div>
        <h2
          className={`${titleSize} font-medium tracking-tight text-white leading-none`}
        >
          {m.name}
        </h2>
        <div className="text-[13px] text-white/60 tabular-nums mt-1">
          {years}
        </div>
      </div>
    </a>
  );
}
