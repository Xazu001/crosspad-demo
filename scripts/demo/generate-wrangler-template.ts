/**
 * Generate wrangler.jsonc template with placeholders
 * Used for demo/public repository setup
 */
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const WRANGLER_TEMPLATE = `/**
 * Wrangler configuration for Crosspad Demo
 * 
 * Setup instructions:
 * 1. Run: wrangler login
 * 2. Create D1 database: wrangler d1 create crosspad-demo
 * 3. Create R2 bucket: wrangler r2 bucket create crosspad-demo
 * 4. Create KV namespace: wrangler kv:namespace create kv
 * 5. Create queues: wrangler queue create crosspad-demo
 * 6. Create DLQ: wrangler queue create crosspad-demo-dlq
 * 7. Fill in the XXXXXX placeholders below with your resource IDs
 */
{
  // Get from: https://dash.cloudflare.com/ (right sidebar)
  "account_id": "XXXXXX",
  
  "$schema": "node_modules/wrangler/config-schema.json",
  "compatibility_date": "2025-12-17",
  "compatibility_flags": ["nodejs_compat"],
  
  // Your worker name (choose any name)
  "name": "XXXXXX",
  
  "main": "./worker.ts",
  "observability": {
    "enabled": true,
  },
  "dev": {
    "port": 5173,
  },
  
  // ──────────────────────────────────────────────────────────────
  // Local Dev Config (base)
  // ──────────────────────────────────────────────────────────────
  "vars": {
    // Your contact email (optional - for demo use generic)
    "CONTACT_EMAIL": "XXXXXX",
    "IS_DEV": true,
  },
  
  "d1_databases": [
    {
      "binding": "db",
      // Database name from: wrangler d1 create <name>
      "database_name": "XXXXXX",
      // Database ID from: wrangler d1 list
      // Or: https://dash.cloudflare.com/ -> Workers & Pages -> D1
      "database_id": "XXXXXX",
      "migrations_dir": "drizzle",
      "remote": true,
    },
  ],
  
  "r2_buckets": [
    {
      "binding": "r2",
      // Bucket name from: wrangler r2 bucket create <name>
      "bucket_name": "XXXXXX",
      "remote": true,
    },
  ],
  
  "kv_namespaces": [
    {
      // Namespace ID from: wrangler kv:namespace list
      // Or: https://dash.cloudflare.com/ -> Workers & Pages -> KV
      "id": "XXXXXX",
      "binding": "kv",
      "remote": true,
    },
  ],
  
  "triggers": {
    "crons": ["0 0 * * *", "0 1 * * SUN"],
  },
  
  "queues": {
    "producers": [
      {
        "binding": "queue",
        // Queue name from: wrangler queue create <name>
        "queue": "XXXXXX",
      },
    ],
    "consumers": [
      {
        // Same queue name as producer
        "queue": "XXXXXX",
        "max_batch_size": 10,
        // Dead letter queue name from: wrangler queue create <name>-dlq
        "dead_letter_queue": "XXXXXX",
      },
    ],
  },
  
  "assets": {
    "binding": "ASSETS",
    "directory": "public",
  },
}
`;

export function generateWranglerTemplate(): void {
  const outputPath = resolve(process.cwd(), "wrangler.jsonc");

  if (existsSync(outputPath)) {
    console.log("\n  ⚠️  wrangler.jsonc already exists");
    console.log("  💾 Creating backup: wrangler.jsonc.backup\n");

    const existing = require("fs").readFileSync(outputPath, "utf-8");
    writeFileSync(resolve(process.cwd(), "wrangler.jsonc.backup"), existing, "utf-8");
  }

  writeFileSync(outputPath, WRANGLER_TEMPLATE, "utf-8");

  console.log("\n  ✅ Generated wrangler.jsonc template\n");
  console.log("  📄 File: wrangler.jsonc");
  console.log("  📝 Next steps:");
  console.log("     1. Run: wrangler login");
  console.log("     2. Create resources (see comments in wrangler.jsonc)");
  console.log("     3. Replace XXXXXX placeholders with your IDs");
  console.log("     4. Run: pnpm db-full (to run migrations)\n");
}

// Run if called directly
generateWranglerTemplate();
