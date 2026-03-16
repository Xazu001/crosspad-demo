/**
 * Generate drizzle.config.ts file with proper env vars
 * Used for demo/public repository setup
 */
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const DRIZZLE_CONFIG_CONTENT = `
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/database/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DB_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
`;

export function generateDrizzleConfig(): void {
  const outputPath = resolve(process.cwd(), "drizzle.config.ts");

  if (existsSync(outputPath)) {
    console.log("\n  ⚠️  drizzle.config.ts already exists, overwriting...\n");
  }

  writeFileSync(outputPath, DRIZZLE_CONFIG_CONTENT, "utf-8");

  console.log("\n  ✅ Generated drizzle.config.ts\n");
  console.log("  📄 File: drizzle.config.ts");
  console.log("  📝 Uses env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DB_ID, CLOUDFLARE_API_TOKEN");
  console.log("  📝 Next step: Run pnpm db-full to generate and run migrations\n");
}

// Run if called directly
generateDrizzleConfig();
