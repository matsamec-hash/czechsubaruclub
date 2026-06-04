import type { Metadata } from "next";
import { QuizCard } from "./(components)/QuizCard";

export const metadata: Metadata = {
  title: "Subaru kvízy",
  description:
    "Klubové kvízy o Subaru: zjisti, který model se k tobě hodí, nebo otestuj své znalosti značky.",
  alternates: { canonical: "/kviz" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-20">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
        🚗 Klubové kvízy
      </div>
      <h1 className="text-[clamp(30px,5vw,48px)] font-extrabold tracking-tight text-white mb-3 leading-none">
        Subaru kvízy
      </h1>
      <p className="text-white/60 max-w-xl mb-12">
        Zábava pro fanoušky i nováčky. Zjisti, který model je přesně pro tebe, nebo si otestuj, jak dobře značku znáš.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuizCard
          href="/kviz/ktere-subaru-se-k-tobe-hodi"
          label="Personální"
          title="Které Subaru se k tobě hodí?"
          desc="7 otázek a víš, který model je tvůj parťák — od Outbacku po BRZ."
          cta="Spustit →"
          primary
        />
        <QuizCard
          href="/kviz/jak-dobre-znas-subaru"
          label="Znalostní"
          title="Jak dobře znáš Subaru?"
          desc="10 otázek z historie, techniky i legend značky. Kolik dáš?"
          cta="Spustit →"
        />
      </div>
    </div>
  );
}
