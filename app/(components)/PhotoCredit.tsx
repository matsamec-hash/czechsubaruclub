/**
 * Popisek pod fotkou: autor · licence (odkaz na text licence) · odkaz na zdroj.
 *
 * Fotky modelů jsou z Wikimedia Commons pod CC — bez jména autora, názvu
 * licence A odkazu na její text je nesmíme zobrazovat (CC BY-SA 4.0 čl.
 * 3(a)(1)(D); viz výzva Müseler/PhotoClaim na sesterském webu, 10. 9. 2026).
 */
import { licenseUrl } from '@/lib/photo-license';

type Props = {
  credit?: string | null;
  license?: string | null;
  source?: string | null;
  className?: string;
};

export function PhotoCredit({ credit, license, source, className }: Props) {
  if (!credit && !license) return null;
  const href = licenseUrl(license);
  return (
    <p className={className ?? 'mt-1 text-[11px] text-white/35'}>
      Foto: {credit ?? 'neznámý autor'}
      {license && (
        <>
          {' · '}
          {href ? (
            <a href={href} rel="license nofollow noopener" target="_blank" className="underline">
              {license}
            </a>
          ) : (
            license
          )}
        </>
      )}
      {source && (
        <>
          {' · '}
          <a href={source} rel="nofollow noopener" target="_blank" className="underline">
            zdroj
          </a>
        </>
      )}
    </p>
  );
}

/**
 * Varianta bez odkazů — pro místa, kde je popisek uvnitř <a> (dlaždice
 * katalogu). Vnořené odkazy jsou neplatné HTML, plnou atribuci s odkazem na
 * licenci nese souhrnný blok <PhotoCredits> na konci stránky.
 */
export function PhotoCreditPlain({
  credit,
  license,
  className,
}: Omit<Props, 'source'>) {
  if (!credit && !license) return null;
  return (
    <span className={className ?? 'block text-[10px] text-white/35'}>
      Foto: {credit ?? 'neznámý autor'}
      {license ? ` · ${license}` : ''}
    </span>
  );
}
