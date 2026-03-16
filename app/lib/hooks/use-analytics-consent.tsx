import { useCookieConsent } from "#/components/custom/cookie-consent";

/**
 * Hook to check if analytics consent has been given.
 *
 * Returns true if analytics cookies are enabled, false otherwise.
 * This can be used to conditionally load analytics scripts.
 */
export function useAnalyticsConsent(): boolean {
  const { preferences } = useCookieConsent();
  return preferences?.analytics ?? false;
}

/**
 * Hook to check if marketing consent has been given.
 *
 * Returns true if marketing cookies are enabled, false otherwise.
 * This can be used to conditionally load marketing pixels.
 */
export function useMarketingConsent(): boolean {
  const { preferences } = useCookieConsent();
  return preferences?.marketing ?? false;
}

/**
 * Hook to check if personalization consent has been given.
 *
 * Returns true if personalization cookies are enabled, false otherwise.
 * This can be used to conditionally load personalization features.
 */
export function usePersonalizationConsent(): boolean {
  const { preferences } = useCookieConsent();
  return preferences?.personalization ?? false;
}
