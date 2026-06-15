import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { getOrganizationJsonLd, getWebApplicationJsonLd } from "@/lib/seo/jsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "PDFHome — Free Online PDF Editor | No Login Required",
    template: "%s | PDFHome",
  },
  description:
    "Edit, merge, split, compress, and convert PDFs directly in your browser. 100% free, no signup required. Your files never leave your device.",
  keywords: [
    "PDF editor",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "free PDF tools",
    "online PDF editor",
    "no login PDF editor",
    "PDF to JPG",
    "JPG to PDF",
    "watermark PDF",
    "sign PDF",
    "add text to PDF",
  ],
  authors: [{ name: "PDFHome" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PDFHome",
    title: "PDFHome — Free Online PDF Editor",
    description:
      "Edit, merge, split, compress, and convert PDFs directly in your browser. 100% free, no signup.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFHome — Free Online PDF Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFHome — Free Online PDF Editor",
    description:
      "Edit, merge, split, compress, and convert PDFs. 100% free, no signup.",
    images: ["/og-image.png"],
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
    // Add Google Search Console verification here when ready
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Theme initialization (before paint to prevent flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebApplicationJsonLd()),
          }}
        />

        {/* Google AdSense */}
        <AdSenseScript />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          <AnalyticsProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AnalyticsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
