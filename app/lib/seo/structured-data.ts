import { SITE_URL } from "@/constants";

/**
 * JSON-LD structured data utilities
 */

/**
 * Base organization structured data
 */
export const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Crosspad",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo.png`,
};

/**
 * Creates website structured data
 */
export function website(name: string = "Crosspad", description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: SITE_URL,
    description: description || "The best launchpad app for creators and artists",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Creates person/profile structured data
 */
export function person(name: string, url?: string, image?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: url || `${SITE_URL}/@${name}`,
    image: image || `${SITE_URL}/assets/default-avatar.png`,
  };
}

/**
 * Creates music group/artist structured data
 */
export function musicGroup(name: string, url?: string, image?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name,
    url: url || `${SITE_URL}/@${name}`,
    image: image || `${SITE_URL}/assets/default-avatar.png`,
  };
}

/**
 * Creates software application structured data
 */
export function softwareApplication(
  name: string,
  description?: string,
  image?: string,
  operatingSystem?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description: description || "Crosspad - Launchpad app for creators",
    url: SITE_URL,
    image: image || `${SITE_URL}/assets/graph/crosspad-og-graph.png`,
    operatingSystem: operatingSystem || "Web Browser",
    applicationCategory: "MultimediaApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/**
 * Creates breadcrumb list structured data
 */
export function breadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Type for structured data
 */
export type StructuredData = Record<string, unknown>;

/**
 * Renders structured data as JSON-LD script tag content
 */
export function renderStructuredData(data: StructuredData): string {
  return JSON.stringify(data, null, 2);
}
