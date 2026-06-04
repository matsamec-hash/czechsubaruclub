"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scorePersonality, scoreKnowledge } from "@/lib/quizzes/scoring";
import type { Quiz } from "@/lib/quizzes/types";
import { ShareButton } from "./ShareButton";

function track(event: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined") window.gtag?.("event", event, params);
}

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[index];

  function pick(answerId: string) {
    if (!started) {
      setStarted(true);
      track("quiz_start", { quiz: quiz.slug });
    }
    const next = { ...answers, [question.id]: answerId };
    setAnswers(next);

    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }
    // Poslední otázka -> vyhodnocení.
    track("quiz_complete", { quiz: quiz.slug });
    if (quiz.kind === "personality") {
      const outcomeId = scorePersonality(quiz, next);
      const outcome = quiz.outcomes.find((o) => o.id === outcomeId)!;
      track("quiz_result_model", { slug: outcome.modelSlug });
      router.push(`/kviz/${quiz.slug}/vysledek/${outcome.modelSlug}/`);
    } else {
      setFinished(true);
    }
  }

  if (finished && quiz.kind === "knowledge") {
    return <KnowledgeResult quiz={quiz} answers={answers} onRetry={reset} />;
  }

  function reset() {
    setIndex(0);
    setAnswers({});
    setStarted(false);
    setFinished(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* tečkový progress + ukončení kvízu */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1.5 flex-1">
          {quiz.questions.map((q, i) => (
            <span
              key={q.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index ? "bg-[#4a8dff]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <Link
          href="/kviz"
          aria-label="Ukončit kvíz"
          className="shrink-0 text-white/40 hover:text-white text-lg leading-none transition"
        >
          ✕
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/40">
          Otázka {index + 1} / {total}
        </div>
        {index > 0 && (
          <button
            onClick={() => setIndex(index - 1)}
            className="text-[11px] text-white/40 hover:text-white transition focus-visible:outline-none focus-visible:underline"
          >
            ← Zpět
          </button>
        )}
      </div>
      <h1 className="text-[clamp(20px,3vw,28px)] font-semibold tracking-tight text-white mb-8 leading-snug">
        {question.text}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.answers.map((a) => (
          <button
            key={a.id}
            onClick={() => pick(a.id)}
            className="text-left rounded-xl border border-white/10 bg-[#16161b] px-4 py-4 hover:border-[#4a8dff] hover:bg-[#4a8dff]/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8dff]"
          >
            {"icon" in a && a.icon && <span className="block text-2xl mb-2">{a.icon}</span>}
            <span className="text-[14px] text-white/90">{a.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeResult({
  quiz,
  answers,
  onRetry,
}: {
  quiz: Extract<Quiz, { kind: "knowledge" }>;
  answers: Record<string, string>;
  onRetry: () => void;
}) {
  const { score, total } = scoreKnowledge(quiz, answers);
  const comment =
    score >= 9 ? "Subaru guru! Klobouk dolů." :
    score >= 6 ? "Slušný přehled. Pár chytáků tě dostalo." :
    score >= 3 ? "Základ máš, je co dohánět." :
    "Tady je prostor růst — projdi si odpovědi níž.";
  const shareText = `Skóre ${score}/${total} v kvízu Jak dobře znáš Subaru — zvládneš víc?`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#4a8dff] mb-3">
        🏁 {quiz.title}
      </div>
      <div className="text-[clamp(44px,8vw,64px)] font-extrabold tracking-tight leading-none">
        <span className="text-[#4a8dff]">{score}</span>
        <span className="text-white/40">/{total}</span>
      </div>
      <p className="text-white/70 mt-3 mb-8">{comment}</p>

      <div className="space-y-2 mb-10">
        {quiz.questions.map((q) => {
          const picked = answers[q.id];
          const correct = picked === q.correctId;
          const correctText = q.answers.find((a) => a.id === q.correctId)?.text ?? "";
          const pickedText = q.answers.find((a) => a.id === picked)?.text ?? "—";
          return (
            <div key={q.id} className="rounded-lg border border-white/[0.08] bg-[#16161b] p-3 text-[13px]">
              <div className="flex gap-2">
                <span>{correct ? "✅" : "❌"}</span>
                <div>
                  <div className="text-white/90">{q.text}</div>
                  {!correct && (
                    <div className="text-white/50 mt-1">
                      tvá: <span className="text-[#ff9f9f]">{pickedText}</span>
                      {" · "}správně: <span className="text-[#9fe0a0]">{correctText}</span>
                    </div>
                  )}
                  <div className="text-white/40 mt-1">{q.explanation}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
        >
          Zkusit znovu
        </button>
        <ShareButton
          url={`https://czechsubaruclub.cz/kviz/${quiz.slug}/`}
          title={quiz.title}
          text={shareText}
        />
      </div>
    </div>
  );
}
