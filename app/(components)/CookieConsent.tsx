"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "csc-consent";
const STORAGE_VERSION = 1;

type Consent = {
  version: number;
  analytics: boolean;
  decidedAt: string;
};

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(analytics: boolean) {
  const c: Consent = {
    version: STORAGE_VERSION,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  document.cookie = `csc-consent=${analytics ? "1" : "0"}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent("csc-consent-change", { detail: { analytics } }),
  );
}

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (!c) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[200]">
      <div className="bg-[#131316]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
        <h3 className="text-[15px] font-medium text-white mb-2">
          Cookies a analytika
        </h3>
        <p className="text-[13px] text-white/70 leading-relaxed mb-5">
          Pro vylepšení webu používáme anonymizovanou analytiku (Google
          Analytics 4). Bez tvého souhlasu se žádné analytické cookies
          neukládají. Více v{" "}
          <a
            href="/cookies"
            className="text-[#4a8dff] hover:underline"
          >
            zásadách cookies
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              writeConsent(true);
              setShow(false);
            }}
            className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium bg-white text-black hover:bg-[#4a8dff] hover:text-white transition"
          >
            Přijmout vše
          </button>
          <button
            onClick={() => {
              writeConsent(false);
              setShow(false);
            }}
            className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.12] transition"
          >
            Jen nezbytné
          </button>
        </div>
        <a
          href="/cookies"
          className="block mt-3 text-[12px] text-white/40 hover:text-white/70 transition text-center"
        >
          Spravovat detailně →
        </a>
      </div>
    </div>
  );
}
