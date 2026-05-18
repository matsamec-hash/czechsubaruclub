import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./(components)/SiteHeader";
import { Footer } from "./(components)/Footer";
import { CookieConsent } from "./(components)/CookieConsent";
import { Analytics } from "./(components)/Analytics";

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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "https://czechsubaruclub.cz",
    siteName: "Czech Subaru Club",
    title: "Czech Subaru Club — Encyklopedie všech Subaru",
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
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFY,
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
  category: "automotive",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:px-3 focus:py-2 focus:bg-[#4a8dff] focus:text-white focus:rounded focus:text-sm focus:font-medium"
        >
          Přeskočit na obsah
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
