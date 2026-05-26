import type { Metadata } from "next";
import { PageNumbersClient } from "./PageNumbersClient";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF — Online PDF Numberer",
  description: "Add page numbers to your PDF document online for free. Configure positions, size, fonts, and numbering formats 100% locally.",
  alternates: { canonical: "/add-page-numbers" },
};

export default function PageNumbersPage() {
  return <PageNumbersClient />;
}
