import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hero-radial min-h-[60vh] flex items-center">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#4a8dff] mb-4">
          Error 404
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white">
          Tahle stránka neexistuje
        </h1>
        <p className="mt-6 text-[#8a93a8]">
          Buď je to typo v URL, nebo jsme tu sekci ještě nezveřejnili.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-6 py-3 bg-[#4a8dff] text-white rounded-lg font-medium hover:bg-[#6ea0ff] transition"
        >
          Zpět na úvod
        </Link>
      </div>
    </div>
  );
}
