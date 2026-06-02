import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Apache on Hostinger serves `/modely/foo/` as a directory with index.html,
  // so no rewrite rules are needed for clean URLs.
  trailingSlash: true,
  // Static export cannot use the default image optimizer (no Node server).
  images: { unoptimized: true },
};

export default nextConfig;
