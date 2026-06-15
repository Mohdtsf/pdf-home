import type { Metadata } from "next";
import { HtmlToPdfClient } from "./HtmlToPdfClient";

export const metadata: Metadata = {
  title: "Convert HTML to PDF Online — Free URL/Webpage to PDF Converter",
  description: "Save any web page as a PDF document online for free. Just paste the URL, customize layout settings, and download your high-quality PDF.",
  alternates: { canonical: "/html-to-pdf" },
};

export default function Page() {
  return <HtmlToPdfClient />;
}
