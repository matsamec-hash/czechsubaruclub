/**
 * Popisek pod fotkou: autor · licence · odkaz na zdroj.
 * Fotky modelů jsou z Wikimedia Commons pod CC — bez jména autora je nesmíme
 * zobrazovat (viz výzva Müseler/PhotoClaim na sesterském webu, 10. 9. 2026).
 */
type Props = {
  credit?: string | null;
  license?: string | null;
  source?: string | null;
  className?: string;
};

export function PhotoCredit({ credit, license, source, className }: Props) {
  if (!credit) return null;
  return (
    <p className={className ?? 'mt-1 text-[11px] text-white/35'}>
      Foto: {credit}
      {license ? ` · ${license}` : ''}
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
