import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./(components)/SiteHeader";
import { Footer } from "./(components)/Footer";

export const metadata: Metadata = {
  title: "Czech Subaru Club — encyklopedie všech Subaru",
  description:
    "Kompletní encyklopedie všech modelů a generací Subaru v češtině. Boxer motory, symetrický pohon 4×4, rally heritage.",
  metadataBase: new URL("https://czechsubaruclub.cz"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <head>
        <link
          rel="preload"
          href="/fonts/ChakraPetch-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ChakraPetch-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
