import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podmínky použití",
  description:
    "Smluvní podmínky pro užívání Czech Subaru Club. Provozovatel, autorská práva, omezení odpovědnosti.",
  alternates: { canonical: "/podminky" },
  robots: { index: true, follow: true },
};

export default function PodminkyPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-24">
      <div className="text-[12px] text-white/40 mb-4">
        <a href="/" className="hover:text-white transition">
          Úvod
        </a>{" "}
        / Podmínky použití
      </div>
      <h1 className="text-[clamp(40px,6vw,72px)] font-semibold tracking-[-0.04em] leading-[0.95] text-white mb-12">
        Podmínky{" "}
        <em className="not-italic font-normal font-serif italic">použití</em>
      </h1>
      <div className="prose prose-invert prose-lg max-w-none [&_p]:text-white/70 [&_p]:leading-relaxed [&_h2]:text-white [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_li]:text-white/70 [&_strong]:text-white [&_strong]:font-medium [&_a]:text-[#4a8dff] [&_a:hover]:underline">
        <p className="text-white/40 text-sm mb-12">
          Aktualizováno 17. května 2026
        </p>

        <h2>Provozovatel</h2>
        <p>
          Web <strong>czechsubaruclub.cz</strong> provozuje{" "}
          <strong>Samec Digital s.r.o.</strong>, IČO 29547539, se sídlem Na
          Břehu 378, 387 11 Katovice. Kontakt:{" "}
          <a href="mailto:info@samecdigital.com">info@samecdigital.com</a>.
        </p>

        <h2>Nezávislost</h2>
        <p>
          Czech Subaru Club je <strong>nezávislý projekt</strong> a nemá žádné
          spojení se společností Subaru Corporation ani s žádným z jejich
          oficiálních distributorů či dealerů. Obsah webu je čistě
          informativního charakteru.
        </p>

        <h2>Charakter obsahu</h2>
        <p>
          Web slouží jako encyklopedie historických a současných modelů
          Subaru. Údaje (technické parametry, roky výroby, popisy generací)
          čerpáme z veřejných zdrojů — primárně Wikipedie a Wikidaty. Snažíme
          se o přesnost, ale negarantujeme úplnou aktuálnost ani bezchybnost.
        </p>

        <h2>Autorská práva</h2>
        <ul>
          <li>
            <strong>Texty:</strong> původní texty (CZ kontext, redakční obsah)
            jsou chráněny autorským zákonem. Citace s uvedením zdroje jsou
            povoleny.
          </li>
          <li>
            <strong>Strukturovaná data</strong> (modely, generace, motorizace)
            čerpáme z Wikidaty pod licencí{" "}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC0
            </a>
            .
          </li>
          <li>
            <strong>Obrázky modelů</strong> pocházejí z Wikimedia Commons —
            licence se liší (CC BY, CC BY-SA, CC0). Autor a licence jsou
            uvedeny u každého obrázku.
          </li>
          <li>
            <strong>Logo a obchodní značky</strong> Subaru jsou majetkem
            Subaru Corporation a používáme je v nominativním smyslu (jde o
            popis předmětu encyklopedie, nikoliv o tvrzení o spojení).
          </li>
        </ul>

        <h2>Omezení odpovědnosti</h2>
        <p>
          Provozovatel neručí za škody způsobené použitím informací z webu.
          Před technickým zásahem na voze konzultuj autorizovaný servis nebo
          ověřený zdroj. Web neslouží jako návod k opravám.
        </p>

        <h2>Uživatelský obsah (UGC)</h2>
        <p>
          Funkce komunity (galerie aut, diskuze) bude spuštěna v pozdější
          fázi. Pravidla pro UGC budou součástí samostatné domácí stránky
          komunity.
        </p>

        <h2>Změny podmínek</h2>
        <p>
          Tyto podmínky můžeme aktualizovat. Datum poslední úpravy je uvedeno
          nahoře. Pokračováním v užívání webu po změnách vyjadřuješ souhlas s
          nimi.
        </p>

        <h2>Rozhodné právo</h2>
        <p>
          Tyto podmínky se řídí právním řádem České republiky. Případné spory
          řeší věcně a místně příslušné soudy ČR.
        </p>
      </div>
    </article>
  );
}
