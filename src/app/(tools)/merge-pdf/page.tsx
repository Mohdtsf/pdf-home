import type { Metadata } from "next";
import { MergePdfClient } from "./MergePdfClient";

export const metadata: Metadata = {
  title: "Merge PDF — Combine Multiple PDFs into One",
  description:
    "Merge multiple PDF files into a single document. Free, no signup required. Files are processed in your browser for complete privacy.",
  alternates: {
    canonical: "/merge-pdf",
  },
};

export default function MergePdfPage() {
  return <MergePdfClient />;
}
