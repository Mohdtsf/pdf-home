import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
  ],
  authors: [{ name: "PDFHome" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PDFHome",
    title: "PDFHome — Free Online PDF Editor",
    description:
      "Edit, merge, split, compress, and convert PDFs directly in your browser. 100% free, no signup.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
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
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
