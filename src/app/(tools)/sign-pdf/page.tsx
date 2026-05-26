import type { Metadata } from "next";
import { SignPdfClient } from "./SignPdfClient";

export const metadata: Metadata = {
  title: "Sign PDF Online — Free Electronic Signature Tool",
  description: "Sign PDF documents online for free. Draw your signature or type it in cursive. 100% secure and client-side.",
  alternates: { canonical: "/sign-pdf" },
};

export default function SignPdfPage() {
  return <SignPdfClient />;
}
