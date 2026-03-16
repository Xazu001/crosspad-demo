import { useEffect } from "react";

import { loadGoogleAnalytics, removeGoogleAnalytics } from "#/lib/analytics";
import { useAnalyticsConsent } from "#/lib/hooks/use-analytics-consent";

// ──────────────────────────────────────────────────────────────
// Analytics Manager Component
// ──────────────────────────────────────────────────────────────

/**
 * Component that conditionally loads analytics scripts based on user consent.
 * Place this component in your app root or layout.
 *
 * This component handles:
 * - Google Analytics 4 (when analytics consent is given)
 */
export function AnalyticsManager() {
  const hasAnalyticsConsent = useAnalyticsConsent();

  useEffect(() => {
    if (hasAnalyticsConsent) {
      loadGoogleAnalytics();
    } else {
      removeGoogleAnalytics();
    }
  }, [hasAnalyticsConsent]);

  return null;
}
