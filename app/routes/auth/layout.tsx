import { Suspense, lazy } from "react";

import { Outlet, type useFetcher } from "react-router";

import { Breadcrumbs } from "#/components/ui/breadcrumbs";
import type { ResponsiveSizeConfig } from "#/components/utils";
import { createMeta } from "#/lib/seo";

import type { Route } from "./+types/layout";
import layoutStyles from "./layout.style.scss?url";

// ──────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: layoutStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: layoutStyles,
    precedence: "high",
  },
];

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches);
};

export const authSizes: Record<string, ResponsiveSizeConfig<string>> = {
  responsiveSize: {
    default: "lg",
    tablet: "md",
  },
};

// Lazy load BeamsBackground to prevent Three.js from loading immediately
const BeamsBackground = lazy(() =>
  import("#/components/custom/beams-background").then((mod) => ({
    default: mod.BeamsBackground,
  })),
);

// ──────────────────────────────────────────────────────────────

/** Layout for auth pages without props */
export default function LayoutIndex() {
  return (
    <main
      className="nopt"
      style={{
        background: "#000",
      }}
    >
      <Suspense fallback={null}>
        <BeamsBackground />
      </Suspense>
      <Outlet />
    </main>
  );
}

type AuthLayoutProps = {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle: string;
  /** Form fetcher */
  fetcher: ReturnType<typeof useFetcher>;
  /** Content */
  children: React.ReactNode;
  /** Submit handler */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
};

// ──────────────────────────────────────────────────────────────

/** Layout for auth pages with props */
export function AuthLayout(props: AuthLayoutProps) {
  return (
    <section className="auth">
      <div className="auth__container">
        <Breadcrumbs items={[]} backHref="/" className="auth__breadcrumbs" />
        <props.fetcher.Form
          method="post"
          action="."
          className="auth__wrapper"
          onSubmit={props.onSubmit}
        >
          <div className="auth__header">
            <h2 className="auth__title">{props.title}</h2>
            <p className="auth__subtitle">{props.subtitle}</p>
          </div>
          {props.children}
        </props.fetcher.Form>
      </div>
    </section>
  );
}
