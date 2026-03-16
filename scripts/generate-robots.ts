// Generates robots.txt from shared/seo route registry.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getDisallowPaths } from "../shared/seo/routes";
import { generateRobotsTxt } from "../shared/seo/sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../public/robots.txt");

function main() {
  console.log("🤖 Generating robots.txt...\n");

  const disallowed = getDisallowPaths();
  const content = generateRobotsTxt();

  fs.writeFileSync(outputPath, content, "utf8");

  console.log(`  🚫 Disallowed prefixes: ${disallowed.join(", ")}`);
  console.log(`  ✅ Written to: ${outputPath}\n`);
  console.log(content);
  console.log("✅ Done!");
}

main();
