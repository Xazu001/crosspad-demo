import {
  analyticsConsentCookie,
  cookieConsentCookie,
  marketingConsentCookie,
  sessionCookie,
} from "./cookies";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface CookiePreferences {
  necessary: boolean;
  personalization: boolean;
  marketing: boolean;
  analytics: boolean;
}

export interface CookieConsentData {
  hasConsented: boolean;
  preferences: CookiePreferences;
}

// ──────────────────────────────────────────────────────────────
// Cookie Domain Helper
// ──────────────────────────────────────────────────────────────

/**
 * Returns the appropriate cookie domain for the current request.
 *
 * - For crosspad.app domains: returns ".crosspad.app" for shared cookies
 * - For localhost/127.0.0.1 or other hosts: returns undefined (host-only cookie)
 *
 * This ensures cookies work correctly on wrangler dev and non-crosspad domains.
 */
export function getCookieDomainForRequest(request: Request): string | undefined {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // Only use shared domain for crosspad.app
  if (hostname.endsWith("crosspad.app")) {
    return ".crosspad.app";
  }

  // For localhost, 127.0.0.1, or any other domain - use host-only cookie
  return undefined;
}

// ──────────────────────────────────────────────────────────────
// Cookie Helper Functions
// ──────────────────────────────────────────────────────────────

/**
 * Creates a cookie that clears the user session.
 *
 * Sets expiration to the past to ensure browser deletes the cookie.
 * Used for logout functionality.
 *
 * @param request - HTTP request for domain detection
 * @returns Promise resolving to serialized clear session cookie
 */
export async function createClearSessionCookie(request: Request) {
  const domain = getCookieDomainForRequest(request);
  return await sessionCookie.serialize(null, {
    expires: new Date(0), // Unix epoch - forces deletion
    maxAge: 0, // Additional signal to delete cookie
    domain,
  });
}

/**
 * Helper to set multiple cookies in a single response.
 *
 * Iterates through cookie strings and appends them to response headers.
 * Useful when multiple cookies need to be set simultaneously.
 *
 * @param headers - Response headers object
 * @param cookies - Array of serialized cookie strings
 */
export function setMultipleCookies(headers: Headers, cookies: string[]) {
  cookies.forEach((cookie) => {
    headers.append("Set-Cookie", cookie);
  });
}

// ──────────────────────────────────────────────────────────────
// Cookie Consent Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Reads cookie consent data from the request.
 *
 * @param request - The incoming request object
 * @returns Promise resolving to consent data or null if not set
 */
export async function getCookieConsent(request: Request): Promise<CookieConsentData | null> {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) return null;

  try {
    const consentData = await cookieConsentCookie.parse(cookieHeader);
    return consentData;
  } catch {
    return null;
  }
}

/**
 * Creates cookies for storing consent preferences.
 *
 * Sets the main consent cookie and individual category cookies
 * for easy client-side access.
 *
 * @param request - HTTP request for domain detection
 * @param preferences - The user's cookie preferences
 * @returns Array of serialized cookie strings
 */
export async function createConsentCookies(
  request: Request,
  preferences: CookiePreferences,
): Promise<string[]> {
  const cookies: string[] = [];
  const domain = getCookieDomainForRequest(request);

  // Main consent cookie with all preferences
  const consentData: CookieConsentData = {
    hasConsented: true,
    preferences,
  };

  const mainCookie = await cookieConsentCookie.serialize(consentData, {
    domain,
  });
  cookies.push(mainCookie);

  // Individual category cookies for client-side access
  const analyticsCookie = await analyticsConsentCookie.serialize(preferences.analytics, { domain });
  cookies.push(analyticsCookie);

  const marketingCookie = await marketingConsentCookie.serialize(preferences.marketing, { domain });
  cookies.push(marketingCookie);

  return cookies;
}

/**
 * Creates cookies to clear all consent-related data.
 *
 * @param request - HTTP request for domain detection
 * @returns Array of serialized clear cookie strings
 */
export async function createClearConsentCookies(request: Request): Promise<string[]> {
  const cookies: string[] = [];
  const domain = getCookieDomainForRequest(request);

  const clearMainCookie = await cookieConsentCookie.serialize(null, {
    expires: new Date(0),
    maxAge: 0,
    domain,
  });
  cookies.push(clearMainCookie);

  const clearAnalyticsCookie = await analyticsConsentCookie.serialize(null, {
    expires: new Date(0),
    maxAge: 0,
    domain,
  });
  cookies.push(clearAnalyticsCookie);

  const clearMarketingCookie = await marketingConsentCookie.serialize(null, {
    expires: new Date(0),
    maxAge: 0,
    domain,
  });
  cookies.push(clearMarketingCookie);

  return cookies;
}
