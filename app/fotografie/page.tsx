import Link from 'next/link';
import type { Metadata } from 'next';
import { listModels } from '@/lib/data/models';

export const metadata: Metadata = {
  title: 'Fotografie — autoři a licence | Czech Subaru Club',
  description:
    'Autoři a licence fotografií použitých na webu. Snímky pocházejí z Wikimedia Commons pod licencemi Creative Commons.',
};

export default function FotografiePage() {
  // Licence CC BY / CC BY-SA vyžadují uvedení autora. Na výpisech modelů je
  // fotek mnoho najednou, proto vede z patičky odkaz sem, kde je kredit ke každé.
  const modely = listModels().filter((m) => m.heroImageUrl && m.heroImageCredit);

  return (
    <main className="mx-auto max-w-3xl px-8 py-20">
      <h1 className="text-3xl font-bold">Fotografie — autoři a licence</h1>
      <p className="mt-4 text-white/60 leading-relaxed">
        Fotografie modelů pocházejí z Wikimedia Commons. U každé uvádíme autora, licenci a odkaz
        na původní soubor. Pokud jsme někde udělali chybu, napište na{' '}
        <a href="mailto:info@samecdigital.com" className="underline">
          info@samecdigital.com
        </a>{' '}
        a opravíme to.
      </p>

      <ul className="mt-10 space-y-3">
        {modely.map((m) => (
          <li key={m.slug} className="text-[13px] text-white/60">
            <Link href={`/modely/${m.slug}`} className="text-white/80 hover:text-white">
              {m.name}
            </Link>
            {' — '}
            {m.heroImageCredit}
            {m.heroImageLicense ? ` · ${m.heroImageLicense}` : ''}
            {m.heroImageSource && (
              <>
                {' · '}
                <a
                  href={m.heroImageSource}
                  rel="nofollow noopener"
                  target="_blank"
                  className="underline"
                >
                  zdroj
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
