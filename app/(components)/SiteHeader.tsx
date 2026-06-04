import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0c]/60 border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-8 py-3.5 flex items-center gap-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-medium text-[15px] tracking-tight text-white hover:opacity-90 transition"
        >
          <span className="relative w-[18px] h-[18px] rounded-full bg-[#4a8dff]">
            <span className="absolute inset-1 rounded-full bg-[#0a0a0c]" />
          </span>
          Czech Subaru Club
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-white/60">
          <Link href="/modely" className="hover:text-white transition">
            Modely
          </Link>
          <Link href="/kviz" className="hover:text-white transition">
            Kvíz
          </Link>
          <Link href="/#historie" className="hover:text-white transition">
            Historie
          </Link>
          <Link href="/#timeline" className="hover:text-white transition">
            Timeline
          </Link>
          <Link href="/#komunita" className="hover:text-white transition">
            Komunita
          </Link>
        </nav>
        <div className="ml-auto relative w-full max-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Hledat"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.06] transition"
          />
        </div>
      </div>
    </header>
  );
}
