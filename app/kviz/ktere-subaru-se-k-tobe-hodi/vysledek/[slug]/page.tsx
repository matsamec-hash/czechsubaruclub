import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel } from "@/lib/data/models";
import { ktereSubaru } from "@/lib/quizzes";
import { ShareButton } from "@/app/(components)/ShareButton";

export const dynamicParams = false;

function outcomeForSlug(slug: string) {
  return ktereSubaru.outcomes.find((o) => o.modelSlug === slug);
}

async function fetchModel(slug: string) {
  return getModel(slug);
}

export function generateStaticParams() {
  return ktereSubaru.outcomes.map((o) => ({ slug: o.modelSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const outcome = outcomeForSlug(slug);
  const model = await fetchModel(slug);
  const name = model?.name ?? slug;
  const title = `Tvé Subaru je ${name}`;
  const desc = outcome?.blurb ?? `Výsledek kvízu: ${name}.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${slug}` },
    openGraph: { title, description: desc, type: "article" },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const outcome = outcomeForSlug(slug);
  if (!outcome) notFound();

  const model = await fetchModel(slug);
  // Integrita: outcome odkazuje na model, který v katalogu musí existovat.
  if (!model) {
    throw new Error(
      `[kviz] Výsledek odkazuje na neexistující model "${slug}". Oprav modelSlug v lib/quizzes/ktere-subaru.ts nebo doplň model do katalogu.`,
    );
  }

  const shareUrl = `https://czechsubaruclub.cz/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${slug}/`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div
        className="rounded-2xl border border-white/[0.08] p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(74,141,255,.16), transparent 60%), #0e0e12",
        }}
      >
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
          {outcome.emoji} Tvůj typ je {outcome.archetype.toLowerCase()}
        </div>

        {model.heroImageUrl && (
          <img
            src={model.heroImageUrl}
            alt={model.name}
            className="w-full h-48 sm:h-56 object-cover rounded-xl border border-white/[0.08] mb-5"
          />
        )}

        <div className="text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1">
          Tvé Subaru je
        </div>
        <h1 className="text-[clamp(28px,5vw,40px)] font-extrabold tracking-tight text-white mb-4 leading-none">
          {model.name}
        </h1>
        <p className="text-[15px] text-white/70 leading-relaxed mb-7">
          {outcome.blurb}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/modely/${slug}`}
            className="rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
          >
            Prohlédnout {model.name} →
          </Link>
          <Link
            href="/kviz/ktere-subaru-se-k-tobe-hodi"
            className="rounded-lg border border-white/12 text-white/80 text-sm px-5 py-2.5 hover:border-[#4a8dff] hover:text-white transition"
          >
            Zkusit znovu
          </Link>
        </div>

        <div className="mt-6">
          <ShareButton
            url={shareUrl}
            title={`Tvé Subaru je ${model.name}`}
            text={`Můj výsledek: ${model.name}. Které Subaru se hodí k tobě?`}
          />
        </div>
      </div>
    </div>
  );
}
