import type { Metadata } from "next";
import { PdfToWordClient } from "./PdfToWordClient";

export const metadata: Metadata = {
  title: "Convert PDF to Word Online — Free PDF to DOCX Converter",
  description: "Convert your PDF files to editable DOCX Word documents for free. No login or email required, secure and precise formatting.",
  alternates: { canonical: "/pdf-to-word" },
};

export default function Page() {
  return <PdfToWordClient />;
}
