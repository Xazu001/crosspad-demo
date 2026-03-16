import { APP_GTAG } from "@/constants/site";

// ──────────────────────────────────────────────────────────────
// Google Analytics (gtag.js)
// ──────────────────────────────────────────────────────────────

/**
 * Load Google Analytics 4 script dynamically.
 * Only call this after user has given analytics consent.
 */
export function loadGoogleAnalytics(): void {
  // Check if GA is already loaded
  if (window.gtag !== undefined) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Initialize gtag function
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());

  // Get GA measurement ID
  const measurementId = APP_GTAG || "G-XXXXXXXXXX";

  // Load GA script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.id = "ga-script";
  document.head.appendChild(script);

  // Configure GA
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    cookie_flags: "secure;samesite=none",
  });
}

/**
 * Remove Google Analytics script and clear all GA cookies.
 * Call this when user revokes analytics consent.
 */
export function removeGoogleAnalytics(): void {
  // Remove GA script
  const gaScript = document.getElementById("ga-script");
  if (gaScript) {
    gaScript.remove();
  }

  // Clear GA cookies
  const gaCookies = [
    "_ga",
    "_gid",
    "_gat",
    "AMP_TOKEN",
    "__utma",
    "__utmb",
    "__utmc",
    "__utmt",
    "__utmz",
  ];

  gaCookies.forEach((cookie) => {
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  // Clear gtag
  window.gtag = undefined;
}

/**
 * Track a page view in Google Analytics.
 * Safe to call even if GA is not loaded (no-op).
 */
export function trackPageView(path: string): void {
  if (window.gtag === undefined) return;
  window.gtag("event", "page_view", { page_path: path });
}

/**
 * Track a custom event in Google Analytics.
 * Safe to call even if GA is not loaded (no-op).
 */
export function trackEvent(action: string, category: string, label?: string, value?: number): void {
  if (window.gtag === undefined) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// ──────────────────────────────────────────────────────────────
// Type Declarations
// ──────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
