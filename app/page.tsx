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
    address: {
      "@type": "PostalAddress",
      streetAddress: "Na Břehu 378",
      addressLocality: "Katovice",
      addressCountry: "CZ",
    },
    identifier: "29547539",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="hero-radial">
        <section className="mx-auto max-w-6xl px-6 py-32 md:py-48 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#4a8dff] mb-6">
            ▲ Encyklopedie · Live
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-white">
            Czech Subaru Club
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-[#8a93a8] max-w-2xl mx-auto leading-relaxed">
            Encyklopedie všech Subaru.
          </p>
          <p className="mt-8 text-base text-[#8a93a8] max-w-2xl mx-auto leading-relaxed">
            Kompletní katalog modelů a generací od roku 1958. Boxer motory,
            symetrický pohon 4×4, rally heritage, JDM kei rarity.
          </p>
          <div className="mt-12 inline-flex glass px-6 py-3 text-sm text-[#8a93a8]">
            🚧 V přípravě — sledujte czechsubaruclub.cz
          </div>
        </section>
      </div>
    </>
  );
}
