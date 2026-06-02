import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamicParams = false; // static export: only slugs from generateStaticParams are emitted

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

const CATEGORY_BODY: Record<string, string> = {
  sedan: "kompaktní/střední sedan",
  hatchback: "hatchback",
  suv: "SUV",
  wagon: "kombi / station wagon",
  coupe: "coupé",
  kei: "JDM kei car (japonský mikroautomobil)",
  minivan: "rodinný MPV",
  pickup: "pickup",
};

async function fetchModel(slug: string) {
  try {
    const rows = await db
      .select()
      .from(schema.models)
      .where(eq(schema.models.slug, slug))
      .limit(1);
    if (rows.length === 0) {
      console.log(`[fetchModel] slug=${slug} not found in DB`);
    }
    return rows[0] ?? null;
  } catch (err) {
    console.error(`[fetchModel] slug=${slug} failed:`, err);
    return null;
  }
}

async function fetchSiblings(currentSlug: string) {
  try {
    return await db
      .select({
        slug: schema.models.slug,
        name: schema.models.name,
        heroImageUrl: schema.models.heroImageUrl,
        category: schema.models.category,
        productionStart: schema.models.productionStart,
        productionEnd: schema.models.productionEnd,
      })
      .from(schema.models)
      .orderBy(schema.models.slug);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ slug: schema.models.slug })
      .from(schema.models);
    console.log(`[generateStaticParams] /modely: ${rows.length} slugs`);
    return rows.map((r) => ({ slug: r.slug }));
  } catch (err) {
    console.error("[generateStaticParams] /modely failed:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await fetchModel(slug);
  if (!m) {
    return { title: "Model nenalezen", robots: { index: false, follow: false } };
  }
  const yearRange =
    m.productionStart && m.productionEnd
      ? `${m.productionStart}–${m.productionEnd}`
      : m.productionStart
        ? `od ${m.productionStart}`
        : "";
  const description = m.taglineCs
    ? m.taglineCs
    : `${m.nameFull}${yearRange ? ` (${yearRange})` : ""} — ${CATEGORY_BODY[m.category] ?? m.category}. Encyklopedie modelu na Czech Subaru Club.`;
  return {
    title: m.nameFull,
    description,
    alternates: { canonical: `/modely/${slug}` },
    openGraph: {
      title: `${m.nameFull} | Czech Subaru Club`,
      description,
      url: `/modely/${slug}`,
      images: m.heroImageUrl
        ? [
            {
              url: m.heroImageUrl,
              width: 1200,
              height: 630,
              alt: m.nameFull,
            },
          ]
        : undefined,
    },
  };
}

function years(m: {
  productionStart: number | null;
  productionEnd: number | null;
}) {
  if (m.productionStart && m.productionEnd)
    return `${m.productionStart}–${m.productionEnd}`;
  if (m.productionStart) return `od ${m.productionStart}`;
  return "";
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await fetchModel(slug);
  if (!m) notFound();

  const all = await fetchSiblings(slug);
  const idx = all.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : all[all.length - 1];
  const next = idx < all.length - 1 ? all[idx + 1] : all[0];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Úvod", item: "https://czechsubaruclub.cz" },
      { "@type": "ListItem", position: 2, name: "Modely", item: "https://czechsubaruclub.cz/modely" },
      { "@type": "ListItem", position: 3, name: m.name, item: `https://czechsubaruclub.cz/modely/${slug}` },
    ],
  };

  const vehicleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: m.nameFull,
    brand: { "@type": "Brand", name: "Subaru" },
    model: m.name,
    bodyType: CATEGORY_BODY[m.category] ?? m.category,
    ...(m.productionStart && { productionDate: String(m.productionStart) }),
    ...(m.heroImageUrl && { image: m.heroImageUrl }),
    ...(m.descriptionCs && { description: m.descriptionCs }),
    ...(m.descriptionEnRaw && !m.descriptionCs && { description: m.descriptionEnRaw }),
    url: `https://czechsubaruclub.cz/modely/${slug}`,
    manufacturer: {
      "@type": "Organization",
      name: "Subaru Corporation",
      url: "https://www.subaru-global.com/",
    },
  };

  const description = m.descriptionCs ?? m.descriptionEnRaw;
  const hasOnlyEn = !m.descriptionCs && m.descriptionEnRaw;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />

      {/* === HERO === */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {m.heroImageUrl && (
            <>
              <img
                src={m.heroImageUrl}
                alt={m.nameFull}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-[#0a0a0c]/70 to-[#0a0a0c]" />
            </>
          )}
        </div>
        <div className="mx-auto max-w-5xl px-8 pt-24 pb-32 relative">
          <div className="text-[12px] text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition">
              Úvod
            </Link>{" "}
            /{" "}
            <Link href="/modely" className="hover:text-white transition">
              Modely
            </Link>{" "}
            / {m.name}
          </div>
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#88b8ff] font-medium px-2.5 py-1 bg-[#4a8dff]/12 border border-[#4a8dff]/20 rounded">
              {CATEGORY_LABEL[m.category] ?? m.category}
            </span>
            {years(m) && (
              <span className="text-[13px] text-white/60 tabular-nums">
                {years(m)}
              </span>
            )}
          </div>
          <h1 className="text-[clamp(56px,9vw,128px)] font-semibold tracking-[-0.045em] leading-[0.88] text-white">
            {m.name}
          </h1>
          <p className="mt-6 text-[clamp(18px,1.6vw,24px)] text-white/70 font-light">
            {m.nameFull}
          </p>
        </div>
      </section>

      {/* === MAIN === */}
      <section className="mx-auto max-w-5xl px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            {description ? (
              <>
                {hasOnlyEn && (
                  <div className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1.5">
                    <span>⚠</span> Zatím jen v angličtině
                  </div>
                )}
                <div className="prose prose-invert prose-lg max-w-none [&_p]:text-white/75 [&_p]:leading-[1.7] [&_p]:text-[16px]">
                  {description.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <p className="mt-8 text-[12px] text-white/40">
                  Zdroj: Wikipedia /{" "}
                  <Link
                    href={`https://www.wikidata.org/wiki/${m.wikidataQid}`}
                    target="_blank"
                    className="hover:text-white/70 transition underline decoration-white/20"
                  >
                    Wikidata {m.wikidataQid}
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-white/40 text-[15px]">
                Popis tohoto modelu zatím chybí. Dotaháme v dalších fázích.
              </p>
            )}
          </div>

          <aside className="md:col-span-1">
            <div className="bg-[#131316] rounded-lg p-6 sticky top-24">
              <h3 className="text-[11px] uppercase tracking-[0.06em] text-white/40 mb-4">
                Základní info
              </h3>
              <dl className="space-y-3 text-[14px]">
                <div className="flex justify-between gap-4 pb-3 border-b border-white/[0.06]">
                  <dt className="text-white/60">Kategorie</dt>
                  <dd className="text-white text-right">
                    {CATEGORY_LABEL[m.category] ?? m.category}
                  </dd>
                </div>
                {m.productionStart && (
                  <div className="flex justify-between gap-4 pb-3 border-b border-white/[0.06]">
                    <dt className="text-white/60">Výroba</dt>
                    <dd className="text-white text-right tabular-nums">
                      {m.productionEnd
                        ? `${m.productionStart}–${m.productionEnd}`
                        : `od ${m.productionStart}`}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 pb-3 border-b border-white/[0.06]">
                  <dt className="text-white/60">Výrobce</dt>
                  <dd className="text-white text-right">Subaru Corp.</dd>
                </div>
                {m.wikidataQid && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/60">Wikidata</dt>
                    <dd className="text-right">
                      <Link
                        href={`https://www.wikidata.org/wiki/${m.wikidataQid}`}
                        target="_blank"
                        className="text-[#4a8dff] hover:underline tabular-nums"
                      >
                        {m.wikidataQid}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <h3 className="text-[11px] uppercase tracking-[0.06em] text-white/40 mb-3">
                  Hledat v bazaru
                </h3>
                <div className="space-y-2">
                  <a
                    href={`https://www.sauto.cz/inzerce/osobni/subaru/${slug.replace(/-/g, "")}?utm_source=czechsubaruclub`}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="block text-[13px] text-white/70 hover:text-white transition"
                  >
                    Sauto.cz →
                  </a>
                  <a
                    href={`https://www.tipcars.com/hledani?text=subaru+${slug.replace(/-/g, "+")}&utm_source=czechsubaruclub`}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="block text-[13px] text-white/70 hover:text-white transition"
                  >
                    TipCars.com →
                  </a>
                  <a
                    href={`https://aukro.cz/hledej?q=subaru+${slug.replace(/-/g, "+")}&utm_source=czechsubaruclub`}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="block text-[13px] text-white/70 hover:text-white transition"
                  >
                    Aukro.cz →
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* === PREV / NEXT === */}
      <section className="mx-auto max-w-5xl px-8 pb-32">
        <div className="border-t border-white/[0.06] pt-12 grid md:grid-cols-2 gap-8">
          {prev && (
            <Link
              href={`/modely/${prev.slug}`}
              className="group flex flex-col gap-2"
            >
              <span className="text-[11px] uppercase tracking-wider text-white/40">
                ← Předchozí
              </span>
              <span className="text-[20px] font-medium text-white group-hover:text-[#4a8dff] transition">
                {prev.name}
              </span>
              <span className="text-[12px] text-white/60 tabular-nums">
                {years(prev)}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/modely/${next.slug}`}
              className="group flex flex-col gap-2 md:text-right md:items-end"
            >
              <span className="text-[11px] uppercase tracking-wider text-white/40">
                Další →
              </span>
              <span className="text-[20px] font-medium text-white group-hover:text-[#4a8dff] transition">
                {next.name}
              </span>
              <span className="text-[12px] text-white/60 tabular-nums">
                {years(next)}
              </span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
