/**
 * SEO route registry — single source of truth for sitemap & robots.txt generation.
 *
 * Every route with SEO relevance is declared here. Scripts use this config
 * to generate sitemap.xml, robots.txt, and validate meta tags.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RouteVisibility = "public" | "private" | "noindex";
export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SeoRoute {
  /** URL path (no trailing slash, no dynamic segments) */
  path: string;
  /** public = sitemap + crawlable, private = disallow in robots, noindex = crawlable but noindex meta */
  visibility: RouteVisibility;
  /** Sitemap priority 0.0–1.0 (only for public routes) */
  priority?: number;
  /** Sitemap changefreq (only for public routes) */
  changefreq?: ChangeFreq;
  /** Whether path contains dynamic segments like :id (excluded from sitemap, included in robots disallow) */
  dynamic?: boolean;
}

// ============================================================================
// ROUTE REGISTRY
// ============================================================================

export const seoRoutes: SeoRoute[] = [
  // ── Public: Landing & Marketing ──────────────────────────────
  { path: "/", visibility: "public", priority: 1.0, changefreq: "weekly" },
  {
    path: "/landing",
    visibility: "public",
    priority: 0.8,
    changefreq: "weekly",
  },
  { path: "/blog", visibility: "public", priority: 0.7, changefreq: "weekly" },
  {
    path: "/blog/:slug",
    visibility: "public",
    priority: 0.6,
    changefreq: "weekly",
    dynamic: true,
  },
  {
    path: "/changelog",
    visibility: "public",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/contact",
    visibility: "public",
    priority: 0.5,
    changefreq: "monthly",
  },

  // ── Public: Legal ────────────────────────────────────────────
  {
    path: "/legal/all",
    visibility: "public",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/legal/terms",
    visibility: "public",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/legal/privacy",
    visibility: "public",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/legal/cookies",
    visibility: "public",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/legal/account-rules",
    visibility: "public",
    priority: 0.3,
    changefreq: "yearly",
  },

  // ── Public: Kit Play (dynamic) ───────────────────────────────
  {
    path: "/kit/play/:id",
    visibility: "public",
    priority: 0.5,
    changefreq: "weekly",
    dynamic: true,
  },

  // ── Private: Auth ────────────────────────────────────────────
  { path: "/login", visibility: "noindex" },
  { path: "/register", visibility: "noindex" },

  // ── Private: User ────────────────────────────────────────────
  { path: "/profile", visibility: "private" },
  { path: "/profile/notifications", visibility: "private" },
  { path: "/profile/settings", visibility: "private" },

  // ── Private: Kit Editing ─────────────────────────────────────
  { path: "/kit/edit", visibility: "private" },
  { path: "/kit/create", visibility: "private" },

  // ── Private: Admin & API ─────────────────────────────────────
  { path: "/admin", visibility: "private" },
  { path: "/api", visibility: "private" },
];

// ============================================================================
// HELPERS
// ============================================================================

/** Routes that appear in sitemap.xml (public, static only) */
export function getSitemapRoutes(): SeoRoute[] {
  return seoRoutes.filter((r) => r.visibility === "public" && !r.dynamic);
}

/** Route path prefixes to disallow in robots.txt */
export function getDisallowPaths(): string[] {
  const privatePaths = seoRoutes.filter((r) => r.visibility === "private").map((r) => r.path);

  // Deduplicate: if /profile exists, remove /profile/settings etc.
  const minimal = privatePaths.filter(
    (p) => !privatePaths.some((other) => other !== p && p.startsWith(other + "/")),
  );

  return [...new Set(minimal)].sort();
}

/** Routes that should have noindex meta tag */
export function getNoIndexRoutes(): SeoRoute[] {
  return seoRoutes.filter((r) => r.visibility === "noindex");
}

/** Check if a path should be noindex (includes both noindex AND private routes) */
export function isNoIndexPath(path: string): boolean {
  return seoRoutes.some(
    (r) => (r.visibility === "noindex" || r.visibility === "private") && path.startsWith(r.path),
  );
}

/** Check if a path is private (disallowed for crawlers) */
export function isPrivatePath(path: string): boolean {
  return seoRoutes.some((r) => r.visibility === "private" && path.startsWith(r.path));
}
