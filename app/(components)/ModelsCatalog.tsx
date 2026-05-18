"use client";

import { useMemo, useState } from "react";

type Model = {
  slug: string;
  name: string;
  nameFull: string;
  category: string;
  productionStart: number | null;
  productionEnd: number | null;
  heroImageUrl: string | null;
  wikidataQid: string | null;
};

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

function years(m: Model): string {
  if (m.productionStart && m.productionEnd)
    return `${m.productionStart}–${m.productionEnd}`;
  if (m.productionStart) return `od ${m.productionStart}`;
  return "";
}

export function ModelsCatalog({ models }: { models: Model[] }) {
  const cats = useMemo(
    () => Array.from(new Set(models.map((m) => m.category))).sort(),
    [models],
  );
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return models.filter((m) => {
      const catMatch = activeCat === "all" || m.category === activeCat;
      const queryMatch = !q || m.name.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [models, activeCat, query]);

  return (
    <div>
      <div className="flex gap-1.5 items-center flex-wrap mb-10">
        <button
          onClick={() => setActiveCat("all")}
          className={`px-3.5 py-1.5 rounded-full text-[13px] transition border ${
            activeCat === "all"
              ? "bg-white text-black border-white font-medium"
              : "bg-transparent text-white/60 border-white/[0.06] hover:text-white hover:border-white/[0.12]"
          }`}
        >
          Vše ({models.length})
        </button>
        {cats.map((c) => {
          const count = models.filter((m) => m.category === c).length;
          const active = activeCat === c;
          return (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition border ${
                active
                  ? "bg-white text-black border-white font-medium"
                  : "bg-transparent text-white/60 border-white/[0.06] hover:text-white hover:border-white/[0.12]"
              }`}
            >
              {CATEGORY_LABEL[c] ?? c} ({count})
            </button>
          );
        })}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrovat…"
          className="flex-1 min-w-[180px] bg-white/[0.03] border border-white/[0.06] rounded-full px-3.5 py-1.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.12]"
        />
        <span className="ml-auto text-[13px] text-white/40 tabular-nums">
          {filtered.length} z {models.length}
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
        {filtered.map((m) => (
          <a
            key={m.slug}
            href={`/modely/${m.slug}`}
            className="relative block aspect-[4/5] overflow-hidden rounded bg-[#131316] group"
          >
            {m.heroImageUrl && (
              <img
                src={m.heroImageUrl}
                alt={m.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 brightness-[0.85] group-hover:brightness-100"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/95 via-[#0a0a0c]/0 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[17px] font-medium tracking-tight text-white">
                  {m.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                  {CATEGORY_LABEL[m.category] ?? m.category}
                </span>
              </div>
              <div className="text-[12px] text-white/60 tabular-nums">
                {years(m)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
