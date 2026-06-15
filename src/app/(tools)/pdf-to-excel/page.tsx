import type { Metadata } from "next";
import { PdfToExcelClient } from "./PdfToExcelClient";

export const metadata: Metadata = {
  title: "Convert PDF to Excel Online — Free PDF to XLSX Converter",
  description: "Extract tables and data from PDF documents directly to Excel sheets (XLSX) online. Free, safe, and accurate table conversion.",
  alternates: { canonical: "/pdf-to-excel" },
};

export default function Page() {
  return <PdfToExcelClient />;
}
