import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { ktereSubaru } from "@/lib/quizzes";

// Static export: emit sitemap.xml at build time.
export const dynamic = "force-static";

const BASE = "https://czechsubaruclub.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/modely`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/kontakt`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/soukromi`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/podminky`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  let modelRoutes: MetadataRoute.Sitemap = [];
  try {
    const models = await db
      .select({ slug: schema.models.slug, updatedAt: schema.models.updatedAt })
      .from(schema.models);
    modelRoutes = models.map((m) => ({
      url: `${BASE}/modely/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable at build → return static routes only
  }

  const quizRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/kviz`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/kviz/ktere-subaru-se-k-tobe-hodi`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/kviz/jak-dobre-znas-subaru`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    ...ktereSubaru.outcomes.map((o) => ({
      url: `${BASE}/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${o.modelSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticRoutes, ...quizRoutes, ...modelRoutes];
}
