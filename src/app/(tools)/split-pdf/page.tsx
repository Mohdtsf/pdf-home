import type { Metadata } from "next";
import { SplitPdfClient } from "./SplitPdfClient";

export const metadata: Metadata = {
  title: "Split PDF — Separate PDF Pages into Multiple Files",
  description:
    "Split a PDF into individual pages or custom ranges. Free, no signup required. Files are processed in your browser.",
  alternates: {
    canonical: "/split-pdf",
  },
};

export default function SplitPdfPage() {
  return <SplitPdfClient />;
}
