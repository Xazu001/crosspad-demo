/**
 * SEO generators for sitemap.xml and robots.txt.
 * Reads route config from shared/seo/routes.ts — zero boilerplate in scripts.
 */
import { SITE_URL } from "../constants/site";
import { type ChangeFreq, getDisallowPaths, getSitemapRoutes } from "./routes";

// ============================================================================
// ROBOTS.TXT
// ============================================================================

/**
 * Generates robots.txt from the SEO route registry.
 * Private routes are automatically disallowed.
 * @param extraDisallow - Additional paths to disallow beyond the registry
 */
export function generateRobotsTxt(extraDisallow: string[] = []): string {
  const paths = [...new Set([...getDisallowPaths(), ...extraDisallow])].sort();
  const disallow = paths.map((p) => `Disallow: ${p}`).join("\n");

  return `User-agent: *

${disallow}

Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// ============================================================================
// SITEMAP.XML
// ============================================================================

interface SitemapEntry {
  path: string;
  lastMod?: Date;
  priority?: number;
  changefreq?: ChangeFreq;
}

/**
 * Generates sitemap.xml from the SEO route registry.
 * Only public, static routes are included.
 * @param extraEntries - Additional entries beyond the registry (e.g. dynamic pages from DB)
 */
export function generateSitemapXml(extraEntries: SitemapEntry[] = []): string {
  const routes = getSitemapRoutes();
  const today = new Date().toISOString().split("T")[0];

  const allEntries: SitemapEntry[] = [
    ...routes.map((r) => ({
      path: r.path,
      priority: r.priority,
      changefreq: r.changefreq,
    })),
    ...extraEntries,
  ];

  const urls = allEntries
    .map(({ path, lastMod, priority, changefreq }) => {
      const loc = `${SITE_URL}${path}`;
      const lastModStr = lastMod ? lastMod.toISOString().split("T")[0] : today;
      const parts = [`    <loc>${loc}</loc>`, `    <lastmod>${lastModStr}</lastmod>`];
      if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
      if (priority !== undefined) {
        parts.push(`    <priority>${priority}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Generates canonical URL string
 */
export function canonicalUrl(path: string = "/"): string {
  return `${SITE_URL}${path}`;
}
