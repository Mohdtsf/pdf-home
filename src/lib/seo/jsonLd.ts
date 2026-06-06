/**
 * JSON-LD Structured Data generators for SEO.
 * Used in layout.tsx and individual tool pages.
 */

const SITE_NAME = "PDFHome";
const SITE_URL = process.env.SITE_URL || "https://pdfhome.com";

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "Free online PDF editor. Merge, split, compress, convert, and edit PDFs directly in your browser. No signup required.",
    sameAs: [],
  };
}

export function getWebApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free online PDF editor with 12+ tools. Merge, split, compress, convert, watermark, sign, and more. 100% browser-based, no files uploaded to servers.",
    featureList: [
      "Merge PDF files",
      "Split PDF pages",
      "Rotate PDF pages",
      "Compress PDF file size",
      "Convert PDF to JPG",
      "Convert JPG to PDF",
      "Add text to PDF",
      "Add watermark to PDF",
      "Sign PDF documents",
      "Add page numbers",
      "Protect PDF with password",
      "Unlock PDF password",
    ],
  };
}

export function getToolPageJsonLd(tool: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${SITE_NAME}`,
    url: `${SITE_URL}${tool.url}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: tool.description,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
