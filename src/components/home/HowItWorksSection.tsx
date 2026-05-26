import { Upload, Wand2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drag and drop your PDF files or click to browse. Files stay in your browser.",
    gradient: "from-[#667eea] to-[#764ba2]",
  },
  {
    icon: Wand2,
    title: "Edit",
    description: "Use any tool to modify your PDF. Merge, split, rotate, add text, and more.",
    gradient: "from-[#f093fb] to-[#f5576c]",
  },
  {
    icon: Download,
    title: "Download",
    description: "Get your edited PDF instantly. No watermarks, no limits, completely free.",
    gradient: "from-[#43e97b] to-[#38f9d7]",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 border-t border-[var(--color-border-glass)]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Three simple steps. No account needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="relative inline-flex mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">
                  {index + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
