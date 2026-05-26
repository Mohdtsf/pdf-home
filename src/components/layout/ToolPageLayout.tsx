import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface ToolPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient: string;
  children: ReactNode;
}

/**
 * Shared layout wrapper for all tool pages.
 * Provides consistent title, description, and glassmorphism container.
 */
export function ToolPageLayout({
  title,
  description,
  icon: Icon,
  iconGradient,
  children,
}: ToolPageLayoutProps) {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Tool Header */}
        <div className="text-center mb-10">
          <div className={`icon-circle ${iconGradient} w-14 h-14 mx-auto mb-5`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
            {description}
          </p>
        </div>

        {/* Tool Content */}
        <div className="glass-card p-6 md:p-8">{children}</div>
      </div>
    </section>
  );
}
