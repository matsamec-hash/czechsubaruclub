import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana soukromí",
  description:
    "Zásady ochrany osobních údajů Czech Subaru Club. Jak zpracováváme data, GDPR práva, kontakt na správce.",
  alternates: { canonical: "/soukromi" },
  robots: { index: true, follow: true },
};

export default function SoukromiPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-24">
      <div className="text-[12px] text-white/40 mb-4">
        <a href="/" className="hover:text-white transition">
          Úvod
        </a>{" "}
        / Ochrana soukromí
      </div>
      <h1 className="text-[clamp(40px,6vw,72px)] font-semibold tracking-[-0.04em] leading-[0.95] text-white mb-12">
        Ochrana{" "}
        <em className="not-italic font-normal font-serif italic">soukromí</em>
      </h1>
      <div className="prose prose-invert prose-lg max-w-none [&_p]:text-white/70 [&_p]:leading-relaxed [&_h2]:text-white [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_li]:text-white/70 [&_strong]:text-white [&_strong]:font-medium [&_a]:text-[#4a8dff] [&_a:hover]:underline">
        <p className="text-white/40 text-sm mb-12">
          Aktualizováno 17. května 2026
        </p>

        <h2>Správce osobních údajů</h2>
        <p>
          Správcem osobních údajů ve smyslu čl. 4 odst. 7 GDPR je společnost{" "}
          <strong>Samec Digital s.r.o.</strong>, IČO 29547539, se sídlem Na
          Břehu 378, 387 11 Katovice. Kontakt:{" "}
          <a href="mailto:info@samecdigital.com">info@samecdigital.com</a>.
        </p>

        <h2>Jaké údaje zpracováváme</h2>
        <ul>
          <li>
            <strong>Analytika</strong> — anonymizovaná IP a chování na webu
            (Google Analytics 4, pouze po udělení souhlasu).
          </li>
          <li>
            <strong>Logy serveru</strong> — IP a User-Agent po dobu nezbytnou
            pro bezpečnost (max 30 dní), právním základem je oprávněný zájem
            (čl. 6 odst. 1 písm. f) GDPR).
          </li>
          <li>
            <strong>Cookies</strong> — viz{" "}
            <a href="/cookies">samostatná stránka o cookies</a>.
          </li>
        </ul>

        <h2>Doba uchování</h2>
        <p>
          Analytická data jsou uchovávána po dobu 14 měsíců (default GA4),
          serverové logy maximálně 30 dní. Po této době jsou automaticky
          smazány.
        </p>

        <h2>Komu data předáváme</h2>
        <ul>
          <li>
            <strong>Vercel Inc.</strong> (USA) — hosting webu. Standardní
            smluvní doložky dle GDPR.
          </li>
          <li>
            <strong>Supabase Inc.</strong> (USA / EU regiony) — databáze
            obsahu encyklopedie. EU region (Frankfurt).
          </li>
          <li>
            <strong>Google LLC</strong> (USA) — Google Analytics 4 a Google
            Search Console. Standardní smluvní doložky dle GDPR.
          </li>
          <li>
            <strong>Wikimedia Foundation</strong> (USA) — hostuje obrázky
            modelů na Wikimedia Commons (CDN).
          </li>
        </ul>

        <h2>Vaše práva</h2>
        <p>
          Máte právo na přístup, opravu, výmaz („být zapomenut"), omezení
          zpracování, námitku, přenositelnost údajů a odvolání souhlasu.
          Žádost pošlete na{" "}
          <a href="mailto:info@samecdigital.com">info@samecdigital.com</a>,
          vyřídíme do 30 dní. Stížnost můžete podat u{" "}
          <a href="https://www.uoou.cz/" target="_blank" rel="noreferrer">
            Úřadu pro ochranu osobních údajů
          </a>
          .
        </p>

        <h2>Změny zásad</h2>
        <p>
          Tyto zásady můžeme aktualizovat. Datum poslední úpravy je uvedeno
          nahoře. Významné změny oznámíme na úvodní stránce alespoň 14 dní
          předem.
        </p>
      </div>
    </article>
  );
}
