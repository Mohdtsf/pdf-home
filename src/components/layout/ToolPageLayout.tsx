import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";

interface ToolPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient: string;
  children: ReactNode;
  maxWidth?: string;
  hideAds?: boolean;
  hideHeader?: boolean;
  fullWidth?: boolean;
}

/**
 * Shared layout wrapper for all tool pages.
 * Provides consistent title, description, and glassmorphism container.
 * Also integrates AdBanners on the left, right (on desktop) and bottom.
 */
export function ToolPageLayout({
  title,
  description,
  icon: Icon,
  iconGradient,
  children,
  maxWidth = "max-w-7xl",
  hideAds = false,
  hideHeader = false,
  fullWidth = false,
}: ToolPageLayoutProps) {
  return (
    <section className={fullWidth ? "py-4 md:py-6 px-2 md:px-6 w-full" : "py-12 md:py-20 px-4"}>
      <div className={fullWidth ? "w-full mx-auto flex gap-0 justify-center items-start" : "max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-8 xl:gap-16 justify-center items-start"}>

        {/* Left Sidebar Ad (Hidden on smaller screens) */}
        {!hideAds && (
          <div className="hidden xl:block w-[160px] flex-shrink-0 sticky top-24">
            <AdBanner slot="tool-left" format="vertical" className="min-h-[600px] bg-[var(--color-bg-surface)] rounded-xl overflow-hidden" responsive={false} />
          </div>
        )}

        {/* Main Content Area */}
        <div className={fullWidth ? "w-full" : `w-full flex-shrink ${maxWidth}`}>
          {/* Tool Header */}
          {!hideHeader && (
            <div className="text-center mb-10">
              <div className={`icon-circle ${iconGradient} w-14 h-14 mx-auto mb-5`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
              <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
                {description}
              </p>
            </div>
          )}

          {/* Tool Content */}
          <div className={fullWidth ? "p-0" : "glass-card p-6 md:p-8"}>{children}</div>

          {/* Bottom Ad */}
          {!hideAds && (
            <div className="mt-16">
              <AdBanner slot="tool-bottom" format="horizontal" className="min-h-[90px] w-full" />
            </div>
          )}
        </div>

        {/* Right Sidebar Ad (Hidden on smaller screens) */}
        {!hideAds && (
          <div className="hidden xl:block w-[160px] flex-shrink-0 sticky top-24">
            <AdBanner slot="tool-right" format="vertical" className="min-h-[600px] bg-[var(--color-bg-surface)] rounded-xl overflow-hidden" responsive={false} />
          </div>
        )}

      </div>
    </section>
  );
}
