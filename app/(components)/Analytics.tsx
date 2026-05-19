"use client";

import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __ga4Loaded?: boolean;
  }
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("csc-consent");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return Boolean(parsed.analytics);
  } catch {
    return false;
  }
}

function loadGA4(gaId: string) {
  if (window.__ga4Loaded) return;
  window.__ga4Loaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", gaId, {
    anonymize_ip: true,
    cookie_flags: "SameSite=Lax;Secure",
  });
}

export function Analytics() {
  useEffect(() => {
    if (!GA_ID) return;
    if (hasConsent()) loadGA4(GA_ID);
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<{ analytics: boolean }>).detail;
      if (detail?.analytics) loadGA4(GA_ID);
    };
    window.addEventListener("csc-consent-change", listener);
    return () => window.removeEventListener("csc-consent-change", listener);
  }, []);

  return null;
}
