import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";

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

  return [...staticRoutes, ...modelRoutes];
}
