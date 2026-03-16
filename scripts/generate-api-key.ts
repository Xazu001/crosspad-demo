// Generates secure API keys for private endpoints.
import * as crypto from "crypto";

function generateApiKey(prefix: string = "xcp"): string {
  const base64Key = crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${prefix}_${base64Key}`;
}

console.log("🔐 Generating API Keys\n");
console.log("─".repeat(60));
console.log(`PRIV_API_KEY=${generateApiKey("xcp_priv")}`);
console.log("─".repeat(60));
console.log("\n✅ Add to your .env file. Never commit to git!");
