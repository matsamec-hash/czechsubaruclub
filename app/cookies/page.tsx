import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "Informace o cookies používaných na Czech Subaru Club — nezbytné, analytické (GA4 po souhlasu), preferenční.",
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-24">
      <div className="text-[12px] text-white/40 mb-4">
        <a href="/" className="hover:text-white transition">
          Úvod
        </a>{" "}
        / Cookies
      </div>
      <h1 className="text-[clamp(40px,6vw,72px)] font-semibold tracking-[-0.04em] leading-[0.95] text-white mb-12">
        <em className="not-italic font-normal font-serif italic">Cookies</em>
      </h1>
      <div className="prose prose-invert prose-lg max-w-none [&_p]:text-white/70 [&_p]:leading-relaxed [&_h2]:text-white [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_li]:text-white/70 [&_strong]:text-white [&_strong]:font-medium [&_a]:text-[#4a8dff] [&_a:hover]:underline [&_table]:text-sm [&_table]:my-6 [&_th]:text-white [&_th]:font-medium [&_th]:text-left [&_th]:py-2 [&_th]:pr-4 [&_td]:py-2 [&_td]:pr-4 [&_td]:text-white/70 [&_tr]:border-b [&_tr]:border-white/[0.06]">
        <p className="text-white/40 text-sm mb-12">
          Aktualizováno 17. května 2026
        </p>

        <p>
          Cookies jsou malé soubory, které web ukládá v tvém prohlížeči.
          Používáme je pro funkčnost webu a — pouze po souhlasu — pro
          analytiku návštěvnosti.
        </p>

        <h2>Co používáme</h2>

        <h3 className="text-white font-medium mt-8 mb-3 text-xl">
          Nezbytné (vždy aktivní)
        </h3>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Účel</th>
              <th>Doba</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>csc-consent</code>
              </td>
              <td>Uloží tvůj výběr cookies preferencí</td>
              <td>12 měsíců</td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-white font-medium mt-8 mb-3 text-xl">
          Analytické (pouze po souhlasu)
        </h3>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Zdroj</th>
              <th>Účel</th>
              <th>Doba</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>_ga</code>, <code>_ga_*</code>
              </td>
              <td>Google Analytics 4</td>
              <td>Rozlišení návštěvníků a relací (anonymizovaná IP)</td>
              <td>14 měsíců</td>
            </tr>
          </tbody>
        </table>

        <h2>Jak udělit / odvolat souhlas</h2>
        <p>
          Při první návštěvě se zobrazí informační lišta s možností „Přijmout"
          nebo „Odmítnout". Své rozhodnutí můžeš kdykoliv změnit kliknutím na
          „Cookies preference" v patičce webu, nebo smazáním cookie{" "}
          <code>csc-consent</code> v nastavení prohlížeče.
        </p>

        <h2>Cookies třetích stran</h2>
        <p>
          Google Analytics 4 je služba třetí strany. Data se přenáší na
          servery Google LLC (USA) podle standardních smluvních doložek dle
          GDPR. Více v{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            zásadách Google
          </a>
          .
        </p>

        <h2>Nemáme reklamní cookies</h2>
        <p>
          Czech Subaru Club aktuálně{" "}
          <strong>neukládá žádné reklamní cookies</strong>. Pokud v budoucnu
          spustíme reklamu (např. Google AdSense), tyto zásady aktualizujeme a
          přidáme do consent banneru samostatnou kategorii.
        </p>

        <h2>Související</h2>
        <ul>
          <li>
            <a href="/soukromi">Zásady ochrany osobních údajů</a>
          </li>
          <li>
            <a href="/podminky">Podmínky použití</a>
          </li>
        </ul>
      </div>
    </article>
  );
}
