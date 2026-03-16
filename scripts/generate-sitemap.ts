// Generates sitemap.xml from shared/seo route registry.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getSitemapRoutes } from "../shared/seo/routes";
import { generateSitemapXml } from "../shared/seo/sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../public/sitemap.xml");

function main() {
  console.log("🗺️ Generating sitemap.xml...\n");

  const routes = getSitemapRoutes();
  const content = generateSitemapXml();

  fs.writeFileSync(outputPath, content, "utf8");

  console.log(`  📄 Routes: ${routes.length}`);
  console.log(`  ✅ Written to: ${outputPath}\n`);
  console.log(content);
  console.log("✅ Done!");
}

main();
