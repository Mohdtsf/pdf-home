import type { Metadata } from "next";
import { CompressPdfClient } from "./CompressPdfClient";

export const metadata: Metadata = {
  title: "Compress PDF — Reduce PDF File Size Online",
  description: "Compress your PDF files to reduce file size without losing quality. Free, no signup, processed in your browser.",
  alternates: { canonical: "/compress-pdf" },
};

export default function CompressPdfPage() {
  return <CompressPdfClient />;
}
