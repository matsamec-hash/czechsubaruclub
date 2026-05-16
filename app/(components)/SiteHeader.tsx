import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/[0.06] bg-[#050810]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-lg tracking-tight text-white hover:text-[#4a8dff] transition"
        >
          <span className="text-[#4a8dff]">Czech</span>SubaruClub
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#8a93a8]">
          <Link href="/modely" className="hover:text-white transition">
            Modely
          </Link>
          <Link
            href="/o-projektu"
            className="hover:text-white transition hidden sm:inline"
          >
            O projektu
          </Link>
        </nav>
      </div>
    </header>
  );
}
