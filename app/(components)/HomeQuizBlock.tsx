import { QuizCard } from "@/app/kviz/(components)/QuizCard";
import { Reveal } from "./Reveal";

export function HomeQuizBlock() {
  return (
    <section className="mx-auto max-w-7xl px-8 pt-32">
      <Reveal>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
          🚗 Klubové kvízy
        </div>
        <h2 className="text-[clamp(26px,4vw,40px)] font-medium tracking-tight text-white mb-8">
          Jaké Subaru jsi?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuizCard
            href="/kviz/ktere-subaru-se-k-tobe-hodi"
            label="Personální"
            title="Které Subaru se k tobě hodí?"
            desc="7 otázek a víš, který model je tvůj parťák."
            cta="Spustit kvíz →"
            primary
          />
          <QuizCard
            href="/kviz/jak-dobre-znas-subaru"
            label="Znalostní"
            title="Jak dobře znáš Subaru?"
            desc="Otestuj své znalosti značky v 10 otázkách."
            cta="Spustit →"
          />
        </div>
      </Reveal>
    </section>
  );
}
