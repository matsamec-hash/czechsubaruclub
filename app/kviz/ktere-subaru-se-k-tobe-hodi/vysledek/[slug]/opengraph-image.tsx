import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ktereSubaru } from "@/lib/quizzes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ktereSubaru.outcomes.map((o) => ({ slug: o.modelSlug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const outcome = ktereSubaru.outcomes.find((o) => o.modelSlug === slug);
  const rows = await db
    .select({ name: schema.models.name })
    .from(schema.models)
    .where(eq(schema.models.slug, slug))
    .limit(1);
  const name = rows[0]?.name ?? slug;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(74,141,255,0.25), transparent 60%), #0a0a0c",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#4a8dff", letterSpacing: 2 }}>
          {outcome?.emoji ?? "🚗"} {(outcome?.archetype ?? "Výsledek kvízu").toUpperCase()}
        </div>
        <div style={{ fontSize: 34, color: "#a1a1a8", marginTop: 24 }}>
          Tvé Subaru je
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{name}</div>
        <div style={{ fontSize: 26, color: "#88b8ff", marginTop: 40 }}>
          czechsubaruclub.cz — Které Subaru se k tobě hodí?
        </div>
      </div>
    ),
    size,
  );
}
