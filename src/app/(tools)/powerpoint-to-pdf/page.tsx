import type { Metadata } from "next";
import { PowerPointToPdfClient } from "./PowerPointToPdfClient";

export const metadata: Metadata = {
  title: "Convert PowerPoint to PDF Online — Free PPTX/PPT to PDF Converter",
  description: "Convert your Microsoft PowerPoint presentations (PPTX, PPT) to PDF files online for free. Maintain all slides, graphics, and transitions layout.",
  alternates: { canonical: "/powerpoint-to-pdf" },
};

export default function Page() {
  return <PowerPointToPdfClient />;
}
