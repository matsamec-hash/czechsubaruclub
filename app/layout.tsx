import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./(components)/SiteHeader";
import { Footer } from "./(components)/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://czechsubaruclub.cz"),
  title: {
    default:
      "Czech Subaru Club — Encyklopedie všech Subaru | modely, generace, historie",
    template: "%s | Czech Subaru Club",
  },
  description:
    "Kompletní česká encyklopedie všech modelů Subaru od roku 1958. Impreza, WRX STI, Forester, Outback, BRZ, JDM kei rarity. Boxer motory, symetrický 4×4, rally heritage.",
  keywords: [
    "Subaru",
    "encyklopedie Subaru",
    "Subaru modely",
    "Subaru Impreza",
    "Subaru WRX STI",
    "Subaru BRZ",
    "Subaru Forester",
    "Subaru Outback",
    "Subaru Legacy",
    "Boxer motor",
    "symetrický pohon 4x4",
    "Subaru rally",
    "JDM Subaru",
    "kei car",
    "Czech Subaru Club",
  ],
  authors: [{ name: "Samec Digital", url: "https://samecdigital.com" }],
  creator: "Samec Digital s.r.o.",
  publisher: "Samec Digital s.r.o.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "https://czechsubaruclub.cz",
    siteName: "Czech Subaru Club",
    title:
      "Czech Subaru Club — Encyklopedie všech Subaru",
    description:
      "Kompletní česká encyklopedie všech modelů Subaru od roku 1958. Boxer motory, symetrický 4×4, rally heritage.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Czech Subaru Club — Encyklopedie všech Subaru",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Czech Subaru Club — Encyklopedie všech Subaru",
    description:
      "Kompletní česká encyklopedie všech modelů Subaru. Boxer motory, 4×4, rally heritage, JDM kei rarity.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
  category: "automotive",
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
