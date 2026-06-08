import { listModels } from "@/lib/data/models";

// Static export: rendered to a static `llms.txt` file at build time.
export const dynamic = "force-static";

export async function GET() {
  const rows = listModels().map((m) => ({
    slug: m.slug,
    name: m.nameFull,
    category: m.category,
    start: m.productionStart,
    end: m.productionEnd,
  }));
  const modelsBlock = rows
    .map(
      (m) =>
        `- ${m.name} (${m.category}, ${m.start ?? "?"}${m.end ? `–${m.end}` : "–dosud"}): https://czechsubaruclub.cz/modely/${m.slug}`,
    )
    .join("\n");

  const body = `# Czech Subaru Club

> Kompletní česká encyklopedie všech modelů Subaru od roku 1958. Boxer motory, symetrický pohon 4×4, rally heritage, JDM kei rarity.

Czech Subaru Club (czechsubaruclub.cz) je nezávislá encyklopedie zaměřená na celou historii Subaru — od kořenů v Nakajima Aircraft Company (1917) přes Fuji Heavy Industries (1953) po dnešní Subaru Corporation (2017+).

Web pokrývá všechny modelové řady včetně JDM-only kei aut, sportovních ikon (WRX STI, BRZ) a moderních EV (Solterra). Každá stránka modelu obsahuje generace, motorizace, technické parametry a CZ kontext.

Provoz: Samec Digital s.r.o. (IČO 29547539, info@samecdigital.com)

## Sekce

- [Modely](https://czechsubaruclub.cz/modely): Kompletní katalog všech ${modelsBlock.split("\n").length} modelů.
- [Historie](https://czechsubaruclub.cz/#historie): Background firmy od Nakajimy po Subaru Corp.
- [Timeline](https://czechsubaruclub.cz/#timeline): Klíčové milníky 1917–2022.

## Modely

${modelsBlock}

## Témata

- Boxer motor: ploché čtyřválce, signature pro Subaru od roku 1966
- Symetrický pohon 4×4: industry standard pro Subaru od Leone 1972
- WRC rally: Impreza WRX STI éra 1995–2008, McRae, Burns, Solberg
- JDM kei cars: Subaru 360, Sambar, Vivio, R1, R2, Pleo, Stella, Rex
- Subaru Tecnica International (STI): tuning divize, založena 1988

## Kontakt

- Web: https://czechsubaruclub.cz
- Email: info@samecdigital.com
- Provoz: Samec Digital s.r.o., IČO 29547539
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
