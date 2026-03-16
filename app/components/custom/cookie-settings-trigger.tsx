import "./cookie-settings-trigger.style.scss";

import * as React from "react";

import { useCookieConsent } from "#/components/custom/cookie-consent";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";

// ──────────────────────────────────────────────────────────────
// Cookie Settings Trigger
// ──────────────────────────────────────────────────────────────

export interface CookieSettingsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "button" | "link";
  size?: "sm" | "md" | "lg";
}

/**
 * Button to open cookie preferences modal.
 * Can be used in footer, settings page, or anywhere users need to manage their cookie preferences.
 */
export const CookieSettingsTrigger = React.forwardRef<
  HTMLButtonElement,
  CookieSettingsTriggerProps
>(({ className, variant = "link", size = "sm", children, ...props }, ref) => {
  const { openPreferences } = useCookieConsent();

  if (variant === "link") {
    return (
      <button
        ref={ref}
        className={cn("cookie-settings-trigger", className)}
        onClick={openPreferences}
        {...props}
      >
        {children || "Cookie Settings"}
      </button>
    );
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size={size}
      onClick={openPreferences}
      className={cn("cookie-settings-trigger--button", className)}
      {...props}
    >
      <Icon.Cookie size={size} />
      {children || "Cookie Settings"}
    </Button>
  );
});

CookieSettingsTrigger.displayName = "CookieSettingsTrigger";
