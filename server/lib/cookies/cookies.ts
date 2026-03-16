// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { SITE_URL } from "@/constants";

import { createCookie } from "react-router";

// IS_DEV is injected by Vite (vite.config.ts) and Cloudflare (wrangler.jsonc)
declare const IS_DEV: boolean;

// ──────────────────────────────────────────────────────────────
// Cookie Domain Helper
// ──────────────────────────────────────────────────────────────

/**
 * Extract cookie domain from SITE_URL.
 * In production, returns ".crosspad.app" for cross-subdomain cookies.
 * In development, returns undefined for host-only cookies.
 */
function getCookieDomain(): string | undefined {
  if (IS_DEV) return undefined;

  // Extract domain from SITE_URL and add leading dot for subdomain sharing
  const url = new URL(SITE_URL);
  return `.${url.hostname}`;
}

const cookieDomain = getCookieDomain();

// ──────────────────────────────────────────────────────────────
// Session Cookie
// ──────────────────────────────────────────────────────────────

/**
 * Session cookie for storing JWT tokens.
 *
 * Configured with security best practices:
 * - httpOnly: Prevents XSS attacks by blocking JavaScript access
 * - secure: Only sent over HTTPS in production
 * - sameSite: CSRF protection with 'lax' setting
 * - 30-day expiration for persistent sessions
 *
 * Note: secrets must be set at runtime via serialize options
 */
export const sessionCookie = createCookie("session", {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  ...(cookieDomain && { domain: cookieDomain }),
});

// ──────────────────────────────────────────────────────────────
// Preferences Cookie
// ──────────────────────────────────────────────────────────────

/**
 * Preferences cookie for storing user UI preferences.
 *
 * Long-lived (1 year), persists across sessions and logouts.
 * Not cleared during sign-out - only session cookie is cleared.
 */
export const preferencesCookie = createCookie("preferences", {
  httpOnly: false,
  secure: !IS_DEV,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
  ...(cookieDomain && { domain: cookieDomain }),
});

// ──────────────────────────────────────────────────────────────
// Cookie Consent
// ──────────────────────────────────────────────────────────────

/**
 * Cookie consent preferences storage.
 *
 * Stores user's cookie consent choices including categories:
 * - necessary: Always required (cannot be disabled)
 * - personalization: User preferences and customization
 * - marketing: Advertising and promotional content
 * - analytics: Website usage statistics and performance
 *
 * Expires after 1 year as per GDPR recommendations.
 */
export const cookieConsentCookie = createCookie("cookie_consent", {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
  ...(cookieDomain && { domain: cookieDomain }),
});

// ──────────────────────────────────────────────────────────────
// Analytics Consent
// ──────────────────────────────────────────────────────────────

/**
 * Analytics tracking consent flag.
 *
 * Separate cookie for quick checking if analytics is enabled.
 * Used by client-side scripts to determine if tracking scripts should load.
 */
export const analyticsConsentCookie = createCookie("analytics_consent", {
  httpOnly: false, // Client needs to read this
  secure: !IS_DEV,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
  ...(cookieDomain && { domain: cookieDomain }),
});

// ──────────────────────────────────────────────────────────────
// Marketing Consent
// ──────────────────────────────────────────────────────────────

/**
 * Marketing cookies consent flag.
 *
 * Separate cookie for quick checking if marketing cookies are enabled.
 * Used by client-side scripts for advertising pixels and retargeting.
 */
export const marketingConsentCookie = createCookie("marketing_consent", {
  httpOnly: false, // Client needs to read this
  secure: !IS_DEV,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
  ...(cookieDomain && { domain: cookieDomain }),
});
