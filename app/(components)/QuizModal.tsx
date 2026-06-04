"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEEN_KEY = "csc_quiz_modal_seen";

function track(event: string) {
  if (typeof window !== "undefined") window.gtag?.("event", event, { quiz: "ktere-subaru-se-k-tobe-hodi" });
}

export function QuizModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/kviz")) return;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = true; // bez storage modal raději nezobrazuj
    }
    if (seen) return;

    let triggered = false;
    function show() {
      if (triggered) return;
      triggered = true;
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      track("quiz_modal_open");
      setOpen(true);
    }

    const timer = window.setTimeout(show, 8000);
    const root = document.documentElement;
    root.addEventListener("mouseleave", show);

    return () => {
      window.clearTimeout(timer);
      root.removeEventListener("mouseleave", show);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Subaru kvíz"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/12 p-7 shadow-2xl"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 0%, rgba(74,141,255,.2), transparent 60%), #131316",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Zavřít"
          autoFocus
          className="absolute top-3 right-3 text-white/40 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#4a8dff] mb-2">
          🚗 Klubový kvíz
        </div>
        <h2 className="text-[20px] font-bold tracking-tight text-white mb-2">
          Které Subaru se k tobě hodí?
        </h2>
        <p className="text-[13px] text-white/60 mb-5 leading-relaxed">
          7 rychlých otázek a víš, který model je tvůj. Zkusíš?
        </p>
        <Link
          href="/kviz/ktere-subaru-se-k-tobe-hodi"
          onClick={() => {
            track("quiz_modal_cta");
            setOpen(false);
          }}
          className="inline-block rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
        >
          Spustit kvíz →
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="block mt-3 text-[12px] text-white/40 hover:text-white/70 transition"
        >
          Teď ne, díky
        </button>
      </div>
    </div>
  );
}
