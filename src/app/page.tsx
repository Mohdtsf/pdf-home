import { HeroSection } from "@/components/home/HeroSection";
import { ToolGridSection } from "@/components/home/ToolGridSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TrustBadgesSection } from "@/components/home/TrustBadgesSection";
import { AdBanner } from "@/components/ads/AdBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      
      {/* Top Homepage Ad */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdBanner slot="homepage-top" format="horizontal" className="min-h-[90px]" />
      </div>

      <ToolGridSection />
      
      {/* Bottom Homepage Ad */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdBanner slot="homepage-bottom" format="horizontal" className="min-h-[90px]" />
      </div>

      <HowItWorksSection />
      <TrustBadgesSection />
    </>
  );
}
