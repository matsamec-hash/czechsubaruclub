import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24 py-12 text-sm text-[#8a93a8]">
      <div className="mx-auto max-w-6xl px-6 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-bold text-white mb-3">
            <span className="text-[#4a8dff]">Czech</span>SubaruClub
          </div>
          <p className="text-xs leading-relaxed">
            Encyklopedie všech modelů Subaru v češtině. Nezávislý projekt,
            žádné spojení se Subaru Corporation.
          </p>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Sekce</div>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/modely" className="hover:text-white transition">
                Modely
              </Link>
            </li>
            <li>
              <Link href="/o-projektu" className="hover:text-white transition">
                O projektu
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Provozovatel</div>
          <p className="text-xs leading-relaxed">
            Samec Digital s.r.o.
            <br />
            IČO 29547539
            <br />
            <a
              href="mailto:info@samecdigital.com"
              className="hover:text-white transition"
            >
              info@samecdigital.com
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 mt-8 text-xs text-[#8a93a8]/60">
        © {new Date().getFullYear()} Samec Digital s.r.o. Všechna práva
        vyhrazena.
      </div>
    </footer>
  );
}
