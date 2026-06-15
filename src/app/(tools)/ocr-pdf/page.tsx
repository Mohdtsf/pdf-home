import type { Metadata } from "next";
import { OcrPdfClient } from "./OcrPdfClient";

export const metadata: Metadata = {
  title: "OCR PDF Online — Convert Scanned PDFs to Searchable Text",
  description: "Perform highly accurate OCR online on your scanned PDFs. Recognize text in English, Spanish, French, German, and Chinese to create searchable PDFs.",
  alternates: { canonical: "/ocr-pdf" },
};

export default function Page() {
  return <OcrPdfClient />;
}
