import type { Metadata } from "next";
import { JpgToPdfClient } from "./JpgToPdfClient";

export const metadata: Metadata = {
  title: "JPG to PDF — Convert Images to PDF",
  description: "Convert JPG, PNG, and WEBP images into a PDF document. Free, no signup, processed in your browser.",
  alternates: { canonical: "/jpg-to-pdf" },
};

export default function JpgToPdfPage() {
  return <JpgToPdfClient />;
}
