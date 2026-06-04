import Link from "next/link";

export function QuizCard({
  href,
  label,
  title,
  desc,
  cta,
  primary,
}: {
  href: string;
  label: string;
  title: string;
  desc: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/[0.08] bg-[#131316] p-6 hover:border-[#4a8dff]/60 transition"
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-[#4a8dff] mb-2">
        {label}
      </div>
      <h2 className="text-[20px] font-semibold tracking-tight text-white mb-2">
        {title}
      </h2>
      <p className="text-[13px] text-white/60 leading-relaxed mb-5">{desc}</p>
      <span
        className={
          primary
            ? "inline-block rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-4 py-2 group-hover:bg-[#3a7def] transition"
            : "inline-block rounded-lg border border-white/12 text-white/80 text-sm px-4 py-2 group-hover:border-[#4a8dff] group-hover:text-white transition"
        }
      >
        {cta}
      </span>
    </Link>
  );
}
