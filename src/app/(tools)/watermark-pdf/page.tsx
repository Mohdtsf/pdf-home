import type { Metadata } from "next";
import { AddWatermarkClient } from "./AddWatermarkClient";

export const metadata: Metadata = {
  title: "Add Watermark to PDF — Stamp Text on Every Page",
  description: "Add a custom text watermark to all pages of your PDF. Configurable opacity, rotation, and color. Free.",
  alternates: { canonical: "/watermark-pdf" },
};

export default function AddWatermarkPage() {
  return <AddWatermarkClient />;
}
