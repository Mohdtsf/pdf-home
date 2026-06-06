"use client";

import Script from "next/script";

/**
 * Loads the Google AdSense script.
 * Only renders in production to avoid console errors during development.
 * 
 * Place this component once in the root layout.
 * The NEXT_PUBLIC_ADSENSE_CLIENT_ID env var must be set for ads to work.
 */
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // Don't load in development or if no client ID is set
  if (process.env.NODE_ENV !== "production" || !clientId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
