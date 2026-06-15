import type { Metadata } from "next";
import { WordToPdfClient } from "./WordToPdfClient";

export const metadata: Metadata = {
  title: "Convert Word to PDF Online — Free DOCX/DOC to PDF Converter",
  description: "Convert your Microsoft Word documents (DOCX, DOC) to PDF files online for free. Keep layouts and formatting identical to the original.",
  alternates: { canonical: "/word-to-pdf" },
};

export default function Page() {
  return <WordToPdfClient />;
}
