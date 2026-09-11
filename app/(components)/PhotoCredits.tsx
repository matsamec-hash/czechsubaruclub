/**
 * Souhrnný blok „Fotografie" pro stránky s mnoha miniaturami.
 *
 * U dlaždic se vejde jen „Foto: autor · licence"; úplná atribuce (odkaz na
 * text licence a na původní soubor) patří sem. Renderuje se serverově, takže
 * je ve statickém HTML i bez JS.
 */
import { licenseUrl } from '@/lib/photo-license';

export type CreditedPhoto = {
  slug: string;
  name: string;
  heroImageUrl?: string | null;
  heroImageCredit?: string | null;
  heroImageLicense?: string | null;
  heroImageSource?: string | null;
};

export function PhotoCredits({
  photos,
  id = 'fotografie',
  title = 'Fotografie',
}: {
  photos: CreditedPhoto[];
  id?: string;
  title?: string;
}) {
  const seen = new Set<string>();
  const items = photos.filter((p) => {
    if (!p.heroImageUrl) return false;
    const key = p.heroImageUrl;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (items.length === 0) return null;

  return (
    <section id={id} className="mx-auto max-w-7xl px-8 pb-24">
      <div className="border-t border-white/[0.06] pt-10">
        <h2 className="text-[12px] uppercase tracking-[0.06em] text-white/40 mb-4">
          {title} — autoři a licence
        </h2>
        <p className="text-[12px] text-white/40 mb-5 max-w-[640px] leading-relaxed">
          Snímky modelů pocházejí z Wikimedia Commons. U každého uvádíme autora,
          licenci s odkazem na její text a odkaz na původní soubor. Fotky nejsou
          upravené (jen ořez zobrazením v dlaždici).
        </p>
        <ul className="grid gap-x-8 gap-y-1.5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const href = licenseUrl(p.heroImageLicense);
            return (
              <li key={p.slug} className="text-[11px] text-white/40 leading-relaxed">
                <span className="text-white/60">{p.name}</span>
                {' — Foto: '}
                {p.heroImageCredit ?? 'neznámý autor'}
                {p.heroImageLicense && (
                  <>
                    {' · '}
                    {href ? (
                      <a
                        href={href}
                        rel="license nofollow noopener"
                        target="_blank"
                        className="underline hover:text-white/70"
                      >
                        {p.heroImageLicense}
                      </a>
                    ) : (
                      p.heroImageLicense
                    )}
                  </>
                )}
                {p.heroImageSource && (
                  <>
                    {' · '}
                    <a
                      href={p.heroImageSource}
                      rel="nofollow noopener"
                      target="_blank"
                      className="underline hover:text-white/70"
                    >
                      zdroj
                    </a>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
