/**
 * Meta utilities for managing page metadata
 * Provides a simple, consistent API for creating meta tags
 */
import { SITE_URL } from "@/constants";

import { isNoIndexPath } from "./robots";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Application metadata configuration */
const SITE_CONFIG = {
  name: "Crosspad",
  title: "Crosspad.app",
  description: "Crosspad - The best launchpad app for creators and artists",
  url: SITE_URL,
  twitter: "@crosspadapp",
  locale: "en_US",
  themeColor: "#000000",
  image: {
    url: "/assets/graph/crosspad-og-graph.png",
    alt: "Crosspad App",
    width: 1200,
    height: 630,
    type: "image/png",
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface MetaTag {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  charset?: string;
  httpEquiv?: string;
  [key: string]: unknown; // Add index signature for React Router compatibility
}

interface MetaOptions {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
  additional?: MetaTag[];
}

interface MetaMatch {
  id: string;
  pathname: string;
  params: Record<string, string | undefined>;
  data?: unknown;
  loaderData?: unknown;
  handle?: { meta?: MetaTag[] };
  route?: { meta?: (args: unknown) => MetaTag[] };
  meta?: MetaTag[];
  [key: string]: unknown; // Allow additional properties for flexibility
}

// ============================================================================
// MAIN META FUNCTION
// ============================================================================

/**
 * Creates meta tags for a page
 * Auto-detects noIndex from seoRoutes based on pathname in matches.
 * @param matches - Route matches array (optional)
 * @param options - Meta configuration options (optional)
 * @returns Array of meta tags
 */
export function createMeta(
  matches?: readonly unknown[] | undefined,
  options?: MetaOptions | undefined,
): MetaTag[] {
  // Extract pathname from matches for auto noIndex detection
  const pathname = matches
    ? (matches as readonly MetaMatch[]).find((m) => m.pathname)?.pathname
    : undefined;

  // Auto-detect noIndex from seoRoutes (explicit override takes precedence)
  const autoNoIndex = pathname ? isNoIndexPath(pathname) : false;
  const noIndex = options?.noIndex ?? autoNoIndex;

  // Start with parent meta from matches if provided
  const parentMeta = matches ? extractMetaFromMatches(matches as readonly MetaMatch[]) : [];
  const newMeta = generateMetaTags({ ...options, noIndex });

  // Merge meta - new tags override parent ones
  return mergeMetaArrays(parentMeta, newMeta);
}

/**
 * Extracts meta tags from route matches
 */
function extractMetaFromMatches(matches: readonly MetaMatch[]): MetaTag[] {
  const meta: MetaTag[] = [];

  for (const match of matches) {
    // Check if match has meta directly (from React Router)
    if (match.meta && Array.isArray(match.meta)) {
      meta.push(...match.meta);
    }

    // Check if route has a meta function
    if (match.route?.meta && typeof match.route.meta === "function") {
      try {
        const routeMeta = match.route.meta({
          data: match.data,
          params: match.params,
          loaderData: match.loaderData,
          matches: matches,
        });
        meta.push(...routeMeta);
      } catch (e) {
        console.error("Error calling meta function:", e);
      }
    }

    // Check if handle has meta
    if (match.handle?.meta) {
      meta.push(...match.handle.meta);
    }
  }

  return meta;
}

/**
 * Generates meta tags from options
 */
function generateMetaTags(options: MetaOptions): MetaTag[] {
  const {
    title,
    description,
    url = SITE_CONFIG.url,
    image = SITE_CONFIG.image.url,
    type = "website",
    noIndex = false,
    additional = [],
  } = options;

  const meta: MetaTag[] = [];
  const fullTitle = title ? `${title}` : SITE_CONFIG.title;
  const fullDescription = description || SITE_CONFIG.description;

  // Basic meta tags
  meta.push({ title: fullTitle });
  meta.push({ name: "description", content: fullDescription });

  // Open Graph tags
  meta.push({ property: "og:type", content: type });
  meta.push({ property: "og:site_name", content: SITE_CONFIG.name });
  meta.push({ property: "og:locale", content: SITE_CONFIG.locale });
  meta.push({ property: "og:title", content: fullTitle });
  meta.push({ property: "og:description", content: fullDescription });
  meta.push({ property: "og:url", content: url });
  meta.push({ property: "og:image", content: image });
  meta.push({ property: "og:image:alt", content: SITE_CONFIG.image.alt });
  meta.push({
    property: "og:image:width",
    content: SITE_CONFIG.image.width.toString(),
  });
  meta.push({
    property: "og:image:height",
    content: SITE_CONFIG.image.height.toString(),
  });
  meta.push({ property: "og:image:type", content: SITE_CONFIG.image.type });

  // Twitter Card tags
  meta.push({ name: "twitter:card", content: "summary_large_image" });
  meta.push({ name: "twitter:site", content: SITE_CONFIG.twitter });
  meta.push({ name: "twitter:creator", content: SITE_CONFIG.twitter });
  meta.push({ name: "twitter:title", content: fullTitle });
  meta.push({ name: "twitter:description", content: fullDescription });
  meta.push({ name: "twitter:image", content: image });

  // Additional meta tags
  meta.push(...additional);

  // SEO tags
  if (noIndex) {
    meta.push({ name: "robots", content: "noindex,nofollow" });
  } else {
    meta.push({ name: "robots", content: "index,follow" });
  }

  return meta;
}

/**
 * Merges meta arrays - new tags override parent ones
 */
function mergeMetaArrays(parent: MetaTag[], child: MetaTag[]): MetaTag[] {
  const metaMap = new Map<string, MetaTag>();

  // Add parent meta first
  for (const tag of parent) {
    const key = getMetaKey(tag);
    if (key) metaMap.set(key, tag);
  }

  // Override with child meta
  for (const tag of child) {
    const key = getMetaKey(tag);
    if (key) metaMap.set(key, tag);
  }

  return Array.from(metaMap.values());
}

/**
 * Gets a unique key for a meta tag
 */
function getMetaKey(tag: MetaTag): string | null {
  if (tag.title) return "title";
  if (tag.property) return `property:${tag.property}`;
  if (tag.name) return `name:${tag.name}`;
  if (tag.charset) return `charset:${tag.charset}`;
  if (tag.httpEquiv) return `http-equiv:${tag.httpEquiv}`;
  return null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates meta tags for a user profile page
 * @param userName - User's name
 * @param userDescription - Optional user bio
 * @param userAvatar - Optional user avatar URL
 * @returns Array of meta tags
 */
export function createUserMeta(
  userName: string,
  userDescription?: string,
  userAvatar?: string,
): MetaTag[] {
  return createMeta(undefined, {
    title: `${userName} - Profile`,
    description: userDescription || `Listen to ${userName}'s kits on Crosspad`,
    image: userAvatar,
    type: "profile",
  });
}

/**
 * Creates meta tags for error pages (404, 500, etc.)
 * @param errorType - Type of error (e.g., "404", "500")
 * @returns Array of meta tags
 */
export function createErrorMeta(errorType: string): MetaTag[] {
  return createMeta(undefined, {
    title: `Error ${errorType}`,
    description: `Something went wrong. Error ${errorType}`,
    noIndex: true,
  });
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use createMeta() instead
 * Returns default meta tags for the root layout
 */
export function getDefaultMeta(): MetaTag[] {
  return createMeta();
}

/**
 * @deprecated This function is no longer needed
 * Meta merging is now handled by React Router's built-in meta handling
 */
export function mergeMeta(_matches: any[], _urlObject?: URL): MetaTag[] {
  return [];
}

/**
 * @deprecated This function is no longer needed
 * Meta functions are now simple and don't need merging
 */
export function withMetaMerging<T extends Record<string, any>>(
  metaFunction: (args: T) => MetaTag[],
): (args: T) => MetaTag[] {
  return metaFunction;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Checks if a meta tag exists in an array
 * @param meta - Array of meta tags
 * @param name - Meta name to check
 * @returns True if meta tag exists
 */
export function hasMetaName(meta: MetaTag[], name: string): boolean {
  return meta.some((tag) => tag.name === name);
}

/**
 * Checks if an Open Graph meta tag exists in an array
 * @param meta - Array of meta tags
 * @param property - OG property to check
 * @returns True if OG meta tag exists
 */
export function hasMetaProperty(meta: MetaTag[], property: string): boolean {
  return meta.some((tag) => tag.property === property);
}

/**
 * Gets the content of a meta tag
 * @param meta - Array of meta tags
 * @param name - Meta name to get
 * @returns Meta content or undefined
 */
export function getMetaContent(meta: MetaTag[], name: string): string | undefined {
  const tag = meta.find((tag) => tag.name === name);
  return tag?.content;
}

/**
 * Gets the content of an Open Graph meta tag
 * @param meta - Array of meta tags
 * @param property - OG property to get
 * @returns Meta content or undefined
 */
export function getOGContent(meta: MetaTag[], property: string): string | undefined {
  const tag = meta.find((tag) => tag.property === property);
  return tag?.content;
}
