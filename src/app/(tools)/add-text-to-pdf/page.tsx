import type { Metadata } from "next";
import { AddTextClient } from "./AddTextClient";

export const metadata: Metadata = {
  title: "Add Text to PDF — Insert Text Anywhere on Your PDF",
  description: "Add custom text to any page of your PDF. Choose font, size, color, and position. Free, no signup.",
  alternates: { canonical: "/add-text-to-pdf" },
};

export default function AddTextPage() {
  return <AddTextClient />;
}
