import type { Metadata } from "next";
import { UnlockPdfClient } from "./UnlockPdfClient";

export const metadata: Metadata = {
  title: "Unlock PDF Online — Remove PDF Password & Restrictions",
  description: "Unlock password-protected PDFs online for free. Remove copy, paste, printing, and opening locks securely from your browser.",
  alternates: { canonical: "/unlock-pdf" },
};

export default function UnlockPdfPage() {
  return <UnlockPdfClient />;
}
