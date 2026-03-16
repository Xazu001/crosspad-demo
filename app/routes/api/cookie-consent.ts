import { type CookiePreferences, createConsentCookies, setMultipleCookies } from "$/lib/cookies";

import { type ActionFunctionArgs, data } from "react-router";

// ──────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const consent = formData.get("consent") as string;
  const preferencesJson = formData.get("preferences") as string;

  let preferences: CookiePreferences;

  try {
    // Parse preferences from form data
    preferences = JSON.parse(preferencesJson || "{}");
  } catch {
    // If parsing fails, use default minimal preferences
    preferences = {
      necessary: true,
      personalization: false,
      marketing: false,
      analytics: false,
    };
  }

  // Ensure necessary cookies are always enabled
  preferences.necessary = true;

  // Handle different consent types
  switch (consent) {
    case "all":
      preferences = {
        necessary: true,
        personalization: true,
        marketing: true,
        analytics: true,
      };
      break;
    case "decline":
      preferences = {
        necessary: true,
        personalization: false,
        marketing: false,
        analytics: false,
      };
      break;
    case "custom":
      // Use parsed preferences
      break;
    default:
      return data({ error: "Invalid consent type" }, { status: 400 });
  }

  // Create and set cookies
  const cookies = await createConsentCookies(request, preferences);
  const headers = new Headers();
  setMultipleCookies(headers, cookies);

  return data(
    {
      consent: true,
      preferences,
      message: "Cookie preferences saved successfully",
    },
    { headers },
  );
}
