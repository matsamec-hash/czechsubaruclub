import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { ModelsCatalog } from "../(components)/ModelsCatalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Modely Subaru — kompletní katalog",
  description:
    "Všechny modely Subaru v jedné encyklopedii. Impreza, WRX STI, BRZ, Forester, Outback, Legacy, JDM kei rarity. 27 modelů, filtrování podle kategorie.",
  alternates: { canonical: "/modely" },
  openGraph: {
    title: "Modely Subaru — kompletní katalog | Czech Subaru Club",
    description:
      "27 modelů Subaru: Impreza, WRX STI, BRZ, Forester, Outback, JDM kei rarity.",
    url: "/modely",
  },
};

async function fetchModels() {
  try {
    return await db
      .select({
        slug: schema.models.slug,
        name: schema.models.name,
        nameFull: schema.models.nameFull,
        category: schema.models.category,
        productionStart: schema.models.productionStart,
        productionEnd: schema.models.productionEnd,
        heroImageUrl: schema.models.heroImageUrl,
        wikidataQid: schema.models.wikidataQid,
      })
      .from(schema.models)
      .orderBy(schema.models.slug);
  } catch {
    return [];
  }
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Úvod",
      item: "https://czechsubaruclub.cz",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Modely",
      item: "https://czechsubaruclub.cz/modely",
    },
  ],
};

export default async function ModelyPage() {
  const models = await fetchModels();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Subaru modely",
    numberOfItems: models.length,
    itemListElement: models.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://czechsubaruclub.cz/modely/${m.slug}`,
      name: m.nameFull,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="mx-auto max-w-7xl px-8 pt-24 pb-12">
        <div className="text-[12px] text-white/40 mb-4">
          <a href="/" className="hover:text-white transition">
            Úvod
          </a>{" "}
          / Modely
        </div>
        <h1 className="text-[clamp(48px,7vw,96px)] font-semibold tracking-[-0.04em] leading-[0.9] text-white max-w-[900px]">
          Všechny{" "}
          <em className="not-italic font-normal font-serif italic">modely</em>{" "}
          Subaru.
        </h1>
        <p className="mt-8 text-[17px] text-white/60 max-w-[640px] leading-relaxed">
          Kompletní katalog 27 modelů od roku 1958 — sedan, SUV, kombi, coupé,
          kei rarity. Filtruj podle kategorie nebo hledej podle názvu.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-8 pb-32">
        {models.length === 0 ? (
          <div className="text-center text-white/40 py-32 text-[14px]">
            Modely se načítají…
          </div>
        ) : (
          <ModelsCatalog models={models} />
        )}
      </section>
    </>
  );
}
