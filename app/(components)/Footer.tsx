import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-7xl px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 text-[15px] font-medium text-white">
            <span className="relative w-[18px] h-[18px] rounded-full bg-[#4a8dff]">
              <span className="absolute inset-1 rounded-full bg-[#0a0a0c]" />
            </span>
            Czech Subaru Club
          </div>
          <p className="mt-4 text-[13px] text-white/60 leading-relaxed max-w-[280px]">
            Encyklopedie všech modelů Subaru v češtině. Nezávislý projekt,
            žádné spojení se Subaru Corporation.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-white mb-4">
            Encyklopedie
          </h4>
          <ul className="space-y-2 text-[13px] text-white/60">
            <li>
              <Link
                href="/modely"
                className="hover:text-white transition"
              >
                Modely
              </Link>
            </li>
            <li>
              <Link
                href="/#historie"
                className="hover:text-white transition"
              >
                Historie
              </Link>
            </li>
            <li>
              <Link
                href="/#timeline"
                className="hover:text-white transition"
              >
                Timeline
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-white mb-4">
            Komunita
          </h4>
          <ul className="space-y-2 text-[13px] text-white/60">
            <li>
              <Link
                href="/#komunita"
                className="hover:text-white transition"
              >
                Pochlub se
              </Link>
            </li>
            <li>
              <Link
                href="/#diskuze"
                className="hover:text-white transition"
              >
                Diskuze
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-white mb-4">
            Provoz
          </h4>
          <ul className="space-y-2 text-[13px] text-white/60">
            <li>Samec Digital s.r.o.</li>
            <li>IČO 29547539</li>
            <li>
              <a
                href="mailto:info@samecdigital.com"
                className="hover:text-white transition"
              >
                info@samecdigital.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-8 mt-16 pt-8 border-t border-white/[0.04] flex justify-between flex-wrap gap-2 text-[12px] text-white/40">
        <span>© {new Date().getFullYear()} Samec Digital</span>
        <span>Made with Boxer ❤ in Czechia</span>
      </div>
    </footer>
  );
}
