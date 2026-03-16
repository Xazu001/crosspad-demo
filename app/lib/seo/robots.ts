/**
 * SEO utilities — re-exports from shared/seo + app-specific helpers
 */
import { SITE_URL } from "@/constants";

// Re-export from shared
export {
  canonicalUrl,
  generateRobotsTxt,
  generateSitemapXml,
  getDisallowPaths,
  getNoIndexRoutes,
  getSitemapRoutes,
  isNoIndexPath,
  isPrivatePath,
  seoRoutes,
} from "@/seo";

export type { ChangeFreq, RouteVisibility, SeoRoute } from "@/seo";

/**
 * Generates canonical URL meta tag (for use in createMeta)
 */
export function canonicalUrlMeta(path: string = "/") {
  return {
    rel: "canonical",
    href: `${SITE_URL}${path}`,
  };
}
