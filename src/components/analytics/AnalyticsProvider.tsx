"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * Tracks page views on route changes.
 * Place this component once in the root layout.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't track the same page twice (e.g., on hot reload)
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    trackEvent({ name: "page_view", path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
