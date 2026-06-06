"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
}

/**
 * Reusable Google AdSense ad banner component.
 * 
 * Props:
 * - slot: Your ad slot ID from AdSense (e.g., "1234567890")
 * - format: Ad format — auto, rectangle, horizontal, vertical
 * - responsive: Whether to enable full-width responsive mode
 * 
 * In development, renders a placeholder instead of a real ad.
 */
export function AdBanner({
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isProduction = process.env.NODE_ENV === "production";
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!isProduction || !clientId) return;

    try {
      // Push ad to adsbygoogle queue
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [isProduction, clientId]);

  // Development placeholder
  if (!isProduction || !clientId) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] text-xs py-6 ${className}`}
      >
        <span>📢 Ad Space — will show when AdSense is configured</span>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
