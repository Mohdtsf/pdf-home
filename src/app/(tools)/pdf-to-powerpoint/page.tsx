import type { Metadata } from "next";
import { PdfToPowerPointClient } from "./PdfToPowerPointClient";

export const metadata: Metadata = {
  title: "Convert PDF to PowerPoint Online — Free PDF to PPTX Converter",
  description: "Convert your PDF documents to editable PowerPoint presentation files (PPTX) online. Free, exact layouts, no installation required.",
  alternates: { canonical: "/pdf-to-powerpoint" },
};

export default function Page() {
  return <PdfToPowerPointClient />;
}
