import type { Metadata } from "next";
import { PdfToJpgClient } from "./PdfToJpgClient";

export const metadata: Metadata = {
  title: "PDF to JPG — Convert PDF Pages to Images",
  description: "Convert PDF pages to high-quality JPG images. Free, no signup, processed in your browser.",
  alternates: { canonical: "/pdf-to-jpg" },
};

export default function PdfToJpgPage() {
  return <PdfToJpgClient />;
}
