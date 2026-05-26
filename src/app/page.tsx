import { HeroSection } from "@/components/home/HeroSection";
import { ToolGridSection } from "@/components/home/ToolGridSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TrustBadgesSection } from "@/components/home/TrustBadgesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ToolGridSection />
      <HowItWorksSection />
      <TrustBadgesSection />
    </>
  );
}
