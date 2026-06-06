import type { Metadata } from "next";
import { EditPdfClient } from "./EditPdfClient";

export const metadata: Metadata = {
  title: "Edit PDF — Fully Edit Text, Draw, and Annotate PDFs",
  description: "Edit original text, draw shapes, freehand draw, sign, and annotate any PDF in your browser. Free, secure, and no signup required.",
  alternates: { canonical: "/edit-pdf" },
};

export default function EditPdfPage() {
  return <EditPdfClient />;
}
