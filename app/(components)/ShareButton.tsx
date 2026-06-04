"use client";

import { useState } from "react";

export function ShareButton({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function nativeOrCopy() {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* uživatel zavřel share sheet — spadneme do kopírování */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard nedostupný — tichý no-op */
    }
  }

  const enc = encodeURIComponent;
  const x = `https://x.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;

  const pill =
    "inline-flex items-center justify-center h-9 px-3 rounded-lg border border-white/12 bg-[#16161b] text-[13px] text-white/80 hover:border-[#4a8dff] hover:text-white transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={nativeOrCopy} className={pill} aria-label="Sdílet / kopírovat odkaz">
        {copied ? "✓ Zkopírováno" : "🔗 Sdílet"}
      </button>
      <a href={x} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Sdílet na X">
        𝕏
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Sdílet na Facebooku">
        f
      </a>
    </div>
  );
}
