import type { Metadata } from "next";
import { ExcelToPdfClient } from "./ExcelToPdfClient";

export const metadata: Metadata = {
  title: "Convert Excel to PDF Online — Free XLSX/XLS to PDF Converter",
  description: "Convert your Microsoft Excel spreadsheets (XLSX, XLS) to PDF files online for free. Keep sheet grids and formulas rendered cleanly.",
  alternates: { canonical: "/excel-to-pdf" },
};

export default function Page() {
  return <ExcelToPdfClient />;
}
