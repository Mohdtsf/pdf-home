import type { Metadata } from "next";
import { Shield, Zap, Globe, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About PDFHome — Free PDF Tools for Everyone",
  description: "PDFHome provides free, browser-based PDF tools. No signup, no file uploads to servers, complete privacy.",
};

const features = [
  {
    icon: Zap,
    title: "100% Free, Forever",
    description: "Every tool is completely free with no hidden premium tiers. We believe everyone deserves access to quality PDF tools.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your files are processed entirely in your browser. They are never uploaded to our servers. What happens on your device, stays on your device.",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No software installation needed. PDFHome works on any modern browser — desktop, tablet, or mobile.",
  },
  {
    icon: Heart,
    title: "Built with Care",
    description: "We obsess over the details to give you the smoothest, most reliable PDF editing experience possible.",
  },
];

export default function AboutPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="gradient-text-aurora">PDFHome</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
            We built PDFHome because PDF tools should be free, fast, and private.
            No one should have to create an account or pay a subscription just to merge two PDFs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card p-6">
              <feature.icon className="w-8 h-8 text-[var(--color-text-primary)] mb-4" />
              <h2 className="text-lg font-semibold mb-2">{feature.title}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">How It Works</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            PDFHome uses cutting-edge browser technology to process your PDFs entirely on your device.
            When you upload a file, it stays in your browser&apos;s memory. Our tools (powered by{" "}
            <code className="text-[var(--color-text-primary)] bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1.5 py-0.5 rounded text-sm">pdf-lib</code> and{" "}
            <code className="text-[var(--color-text-primary)] bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1.5 py-0.5 rounded text-sm">PDF.js</code>)
            manipulate the file locally. When you download the result, it comes straight from your browser.
            Zero server involvement.
          </p>
        </div>
      </div>
    </section>
  );
}
