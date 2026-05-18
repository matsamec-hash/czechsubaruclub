import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakt na provozovatele Czech Subaru Club — Samec Digital s.r.o. Email, IČO, sídlo.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-24">
      <div className="text-[12px] text-white/40 mb-4">
        <a href="/" className="hover:text-white transition">
          Úvod
        </a>{" "}
        / Kontakt
      </div>
      <h1 className="text-[clamp(40px,6vw,72px)] font-semibold tracking-[-0.04em] leading-[0.95] text-white mb-12">
        <em className="not-italic font-normal font-serif italic">Kontakt</em>
      </h1>

      <div className="space-y-12">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.04em] text-white/40 mb-3">
            Provozovatel
          </h2>
          <p className="text-[18px] font-medium text-white">
            Samec Digital s.r.o.
          </p>
          <p className="text-[14px] text-white/60 mt-1">
            IČO 29547539 · Na Břehu 378, 387 11 Katovice
          </p>
        </div>

        <div>
          <h2 className="text-[11px] uppercase tracking-[0.04em] text-white/40 mb-3">
            Email
          </h2>
          <a
            href="mailto:info@samecdigital.com"
            className="text-[18px] font-medium text-[#4a8dff] hover:underline"
          >
            info@samecdigital.com
          </a>
          <p className="text-[13px] text-white/60 mt-2">
            Standardní odezva do 3 pracovních dnů. Pro otázky ohledně GDPR a
            ochrany osobních údajů reagujeme do 30 dní.
          </p>
        </div>

        <div>
          <h2 className="text-[11px] uppercase tracking-[0.04em] text-white/40 mb-3">
            Web
          </h2>
          <p className="text-[15px] text-white/80">
            <a
              href="https://samecdigital.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              samecdigital.com
            </a>
          </p>
        </div>

        <div className="pt-8 border-t border-white/[0.06]">
          <h2 className="text-[11px] uppercase tracking-[0.04em] text-white/40 mb-3">
            Důležité
          </h2>
          <p className="text-[14px] text-white/60 leading-relaxed">
            Czech Subaru Club je nezávislý projekt a nemá žádné spojení se
            společností Subaru Corporation ani s žádným z jejich oficiálních
            distributorů. Pro otázky ohledně servisu, koupě nebo prodeje
            kontaktuj autorizovaného dealera Subaru.
          </p>
        </div>
      </div>
    </article>
  );
}
