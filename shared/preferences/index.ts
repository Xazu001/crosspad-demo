/**
 * User preference cookies management
 */
import { getCookieDomainForRequest, preferencesCookie } from "$/lib/cookies";

// Preference keys
export const PREF_KEYS = {
  LANDING_VISITED: "landingVisited",
} as const;

type Preferences = {
  [PREF_KEYS.LANDING_VISITED]?: boolean;
  // Add more preferences here in the future
};

/**
 * Gets all preferences from cookie
 */
export async function getPreferences(request: Request): Promise<Preferences> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return {};

  try {
    const prefs = await preferencesCookie.parse(cookieHeader);
    return prefs || {};
  } catch {
    return {};
  }
}

/**
 * Checks if user has visited landing page
 */
export async function hasVisitedLanding(request: Request): Promise<boolean> {
  const prefs = await getPreferences(request);
  return prefs[PREF_KEYS.LANDING_VISITED] === true;
}

/**
 * Marks landing page as visited
 */
export async function markLandingVisited(request: Request): Promise<string> {
  // Get current preferences
  const currentPrefs = await getPreferences(request);

  // Update landing visited flag
  const newPrefs = { ...currentPrefs, [PREF_KEYS.LANDING_VISITED]: true };

  // Use request-aware domain for cookie (fixes wrangler dev / non-crosspad domains)
  const domain = getCookieDomainForRequest(request);
  return await preferencesCookie.serialize(newPrefs, { domain });
}

/**
 * Updates specific preferences
 */
export async function updatePreferences(
  currentPrefs: Preferences,
  updates: Partial<Preferences>,
): Promise<string> {
  const newPrefs = { ...currentPrefs, ...updates };
  return await preferencesCookie.serialize(newPrefs);
}
