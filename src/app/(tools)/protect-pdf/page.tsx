import type { Metadata } from "next";
import { ProtectPdfClient } from "./ProtectPdfClient";

export const metadata: Metadata = {
  title: "Protect PDF Online — Password Protect PDF Securely",
  description: "Secure your PDF files online for free. Clean metadata, restrict permissions, and protect files 100% locally in your browser.",
  alternates: { canonical: "/protect-pdf" },
};

export default function ProtectPdfPage() {
  return <ProtectPdfClient />;
}
