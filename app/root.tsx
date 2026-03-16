
import { type ReactNode } from "react";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
} from "react-router";
import { ToastContainer } from "react-toastify";
import toastifyStyles from "react-toastify/dist/ReactToastify.css?url";

import { AnalyticsManager } from "#/components/custom/analytics-manager";
import { CookieConsentProvider } from "#/components/custom/cookie-consent";
import { InfoBoundary } from "#/components/custom/info-boundary";
import { createMeta } from "#/lib/seo";
import mainStyles from "#/style/main.scss?url";
import { type CookieConsentData, getCookieConsent } from "$/lib/cookies";
import { createRouteService, dataMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "../.react-router/types/app/+types/root";

export const links: Route.LinksFunction = () => [
  // Favicon and app icons
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon.ico",
  },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "apple-touch-icon", href: "/assets/logo.png" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  {
    rel: "preload",
    href: "/assets/logo.png",
    as: "image",
    fetchPriority: "high",
  },

  // Font preloading
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Syne:wght@400..800&display=swap",
  },

  // DNS prefetch for performance
  { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
  { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
];

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches);
};

// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getRootData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    const origin = new URL(request.url).origin;
    const cookieConsent = await getCookieConsent(request);

    return this.ok({ user, origin, cookieConsent });
  }
}

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await route.getRootData(request);
  return data(result);
};

export function Layout({ children }: { children: ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link href={mainStyles} rel="stylesheet" precedence="high" />
        <link href={toastifyStyles} rel="stylesheet" precedence="high" />
        <Meta />
        <Links />
      </head>
      <Body cookieConsent={data?.cookieConsent ?? null}>{children}</Body>
    </html>
  );
}

export function Body({
  children,
  cookieConsent,
}: {
  children: ReactNode;
  cookieConsent: CookieConsentData | null;
}) {
  return (
    <body suppressHydrationWarning={true}>
      <div className="layout-grid"></div>
      <CookieConsentProvider
        initialConsent={cookieConsent?.hasConsented ?? null}
        initialPreferences={cookieConsent?.preferences ?? null}
      >
        {children}
        <AnalyticsManager />
      </CookieConsentProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <ScrollRestoration />
      <Scripts />
    </body>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  return <InfoBoundary {...props} />;
}
