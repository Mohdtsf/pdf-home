import type { Metadata } from "next";
import { RotatePdfClient } from "./RotatePdfClient";

export const metadata: Metadata = {
  title: "Rotate PDF — Rotate Pages to Any Orientation",
  description:
    "Rotate individual PDF pages or all pages at once. Free, no signup required. Files are processed in your browser.",
  alternates: {
    canonical: "/rotate-pdf",
  },
};

export default function RotatePdfPage() {
  return <RotatePdfClient />;
}
