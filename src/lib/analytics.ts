/**
 * Lightweight, privacy-first analytics.
 * No cookies, no PII, no fingerprinting.
 * Events are sent via sendBeacon for non-blocking delivery.
 */

export type AnalyticsEvent =
  | { name: "tool_used"; tool: string; fileSize?: number }
  | { name: "download_completed"; tool: string; fileSize?: number }
  | { name: "page_view"; path: string };

const ANALYTICS_ENDPOINT = "/api/analytics";

/**
 * Tracks an anonymous analytics event.
 * Uses sendBeacon for fire-and-forget delivery (won't block page unload).
 */
export function trackEvent(event: AnalyticsEvent): void {
  try {
    const payload = JSON.stringify({
      ...event,
      timestamp: Date.now(),
    });

    // sendBeacon is fire-and-forget — perfect for analytics
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, payload);
    } else {
      // Fallback for older browsers
      fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Silently fail — analytics should never break the app
      });
    }
  } catch {
    // Silently fail
  }
}
