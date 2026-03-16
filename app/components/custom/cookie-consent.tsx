import "./cookie-consent.style.scss";

import * as React from "react";

import { useFetcher } from "react-router";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Icon } from "#/components/ui/icon";
import { Modal, ModalContent } from "#/components/ui/modal";
import { cn } from "#/components/utils";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  personalization: boolean;
  marketing: boolean;
  analytics: boolean;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  hasConsented: boolean | null;
  showBanner: boolean;
  showPreferences: boolean;
  acceptAll: () => void;
  declineAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  hideBanner: () => void;
}

const CookieConsentContext = React.createContext<CookieConsentContextType | null>(null);

export const useCookieConsent = () => {
  const context = React.useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
};

// ──────────────────────────────────────────────────────────────
// Cookie Consent Provider
// ──────────────────────────────────────────────────────────────

export interface CookieConsentProviderProps {
  children: React.ReactNode;
  initialConsent: boolean | null;
  initialPreferences: CookiePreferences | null;
}

export function CookieConsentProvider({
  children,
  initialConsent,
  initialPreferences,
}: CookieConsentProviderProps) {
  const fetcher = useFetcher();
  const [hasConsented, setHasConsented] = React.useState<boolean | null>(initialConsent);
  const [preferences, setPreferences] = React.useState<CookiePreferences | null>(
    initialPreferences,
  );
  const [showBanner, setShowBanner] = React.useState(hasConsented === null);
  const [showPreferences, setShowPreferences] = React.useState(false);

  // Update state when fetcher completes
  React.useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as {
        consent: boolean;
        preferences: CookiePreferences;
      };
      setHasConsented(data.consent);
      setPreferences(data.preferences);
      setShowBanner(false);
      setShowPreferences(false);
    }
  }, [fetcher.data, fetcher.state]);

  const acceptAll = React.useCallback(() => {
    const allPrefs: CookiePreferences = {
      necessary: true,
      personalization: true,
      marketing: true,
      analytics: true,
    };
    fetcher.submit(
      { consent: "all", preferences: JSON.stringify(allPrefs) },
      { method: "post", action: "/api/cookie-consent" },
    );
  }, [fetcher]);

  const declineAll = React.useCallback(() => {
    const minimalPrefs: CookiePreferences = {
      necessary: true,
      personalization: false,
      marketing: false,
      analytics: false,
    };
    fetcher.submit(
      { consent: "decline", preferences: JSON.stringify(minimalPrefs) },
      { method: "post", action: "/api/cookie-consent" },
    );
  }, [fetcher]);

  const savePreferences = React.useCallback(
    (prefs: CookiePreferences) => {
      fetcher.submit(
        { consent: "custom", preferences: JSON.stringify(prefs) },
        { method: "post", action: "/api/cookie-consent" },
      );
    },
    [fetcher],
  );

  const openPreferences = React.useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = React.useCallback(() => {
    setShowPreferences(false);
  }, []);

  const hideBanner = React.useCallback(() => {
    setShowBanner(false);
  }, []);

  const contextValue: CookieConsentContextType = {
    preferences,
    hasConsented,
    showBanner,
    showPreferences,
    acceptAll,
    declineAll,
    savePreferences,
    openPreferences,
    closePreferences,
    hideBanner,
  };

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      {showBanner && <CookieBanner />}
      {showPreferences && <CookiePreferencesModal />}
    </CookieConsentContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────
// Cookie Banner
// ──────────────────────────────────────────────────────────────

function CookieBanner() {
  const { acceptAll, declineAll, openPreferences, hideBanner } = useCookieConsent();

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-banner__container">
        <div className="cookie-consent-banner__content">
          <Icon.Cookie className="cookie-consent-banner__icon" />
          <div className="cookie-consent-banner__text">
            <h3 className="cookie-consent-banner__title">Privacy & Cookies</h3>
            <p className="cookie-consent-banner__description">
              We use cookies to enhance your experience, analyze site traffic, and personalize
              content. By accepting, you agree to our use of cookies.
            </p>
          </div>
        </div>
        <div className="cookie-consent-banner__actions">
          <Button
            variant="destructive"
            size="sm"
            onClick={declineAll}
            className="cookie-consent-banner__decline"
          >
            Decline all
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={openPreferences}
            className="cookie-consent-banner__preferences"
          >
            Preferences
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={acceptAll}
            className="cookie-consent-banner__accept"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Cookie Preferences Modal
// ──────────────────────────────────────────────────────────────

function CookiePreferencesModal() {
  const { preferences, savePreferences, acceptAll, declineAll, closePreferences } =
    useCookieConsent();

  const [localPreferences, setLocalPreferences] = React.useState<CookiePreferences>(
    preferences || {
      necessary: true,
      personalization: false,
      marketing: false,
      analytics: false,
    },
  );

  const handleSave = () => {
    savePreferences(localPreferences);
  };

  const handleCategoryChange = (category: keyof CookiePreferences, checked: boolean) => {
    if (category === "necessary") return; // Cannot disable necessary cookies
    setLocalPreferences((prev) => ({ ...prev, [category]: checked }));
  };

  const categories = [
    {
      key: "necessary" as keyof CookiePreferences,
      title: "Required",
      description: "These cookies are essential for the website to function properly.",
      required: true,
    },
    {
      key: "personalization" as keyof CookiePreferences,
      title: "Personalization",
      description: "These cookies remember your preferences and personalize your experience.",
      required: false,
    },
    {
      key: "marketing" as keyof CookiePreferences,
      title: "Marketing",
      description: "These cookies are used to deliver advertising that is relevant to you.",
      required: false,
    },
    {
      key: "analytics" as keyof CookiePreferences,
      title: "Analytics",
      description: "These cookies help us understand how visitors interact with our website.",
      required: false,
    },
  ];

  return (
    <Modal open={true} onOpenChange={closePreferences}>
      <ModalContent size="lg" variant="popover" className="cookie-consent-modal">
        <div className="cookie-consent-modal__header">
          <h2 className="cookie-consent-modal__title">Cookie & Privacy Preferences</h2>
        </div>

        <div className="cookie-consent-modal__content">
          <p className="cookie-consent-modal__description">
            Manage your cookie preferences below. You can change these settings at any time.
          </p>

          <div className="cookie-consent-modal__categories">
            {categories.map((category) => (
              <div
                key={category.key}
                className={cn(
                  "cookie-consent-modal__category",
                  category.required && "cookie-consent-modal__category--required",
                  !category.required && "cookie-consent-modal__category--clickable",
                )}
                onClick={() => {
                  if (!category.required) {
                    handleCategoryChange(category.key, !localPreferences[category.key]);
                  }
                }}
              >
                <div className="cookie-consent-modal__category-header">
                  <div className="cookie-consent-modal__category-info">
                    <h3 className="cookie-consent-modal__category-title">
                      {category.title}
                      {category.required && (
                        <Badge variant="primary" size="sm">
                          Always active
                        </Badge>
                      )}
                    </h3>
                    <p className="cookie-consent-modal__category-description">
                      {category.description}
                    </p>
                  </div>
                  <Checkbox
                    variant="secondary"
                    size="md"
                    checked={localPreferences[category.key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCategoryChange(category.key, e.target.checked)
                    }
                    disabled={category.required}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cookie-consent-modal__footer">
          <div className="cookie-consent-modal__footer-actions">
            <Button
              variant="destructive"
              onClick={declineAll}
              className="cookie-consent-modal__decline-all"
            >
              Decline all
            </Button>
            <Button
              variant="secondary"
              onClick={acceptAll}
              className="cookie-consent-modal__accept-all"
            >
              Accept all
            </Button>
            <Button variant="primary" onClick={handleSave} className="cookie-consent-modal__save">
              Save my choices
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
