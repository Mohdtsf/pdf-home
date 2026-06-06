import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { Mail, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Get in Touch",
  description: "Have questions or feedback about PDFHome? Get in touch with us.",
};

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Have a question, suggestion, or found a bug? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Info */}
        <div className="glass-card p-8 space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold mb-1">Email</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                For support, feedback, or partnership inquiries:
              </p>
              <a
                href="mailto:hello@pdfhome.com"
                className="text-sm text-[#667eea] hover:underline"
              >
                hello@pdfhome.com
              </a>
            </div>
          </div>

          <div className="border-t border-[var(--color-border-glass)]" />

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#43e97b] to-[#38f9d7] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold mb-1">Feedback</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Found a bug or have a feature request? Use the form below and we&apos;ll get back
                to you within 48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </section>
  );
}
