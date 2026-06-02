import type { MetadataRoute } from "next";

// Static export: emit robots.txt at build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://czechsubaruclub.cz/sitemap.xml",
    host: "https://czechsubaruclub.cz",
  };
}
