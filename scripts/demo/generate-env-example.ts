/**
 * Generate .env file with placeholder values
 * Used for demo/public repository setup
 */
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const ENV_CONTENT = `# ============================================================================
# Crosspad Demo - Environment Variables
# ============================================================================
# Fill in your values below

# Cloudflare Account ID
# Get from: https://dash.cloudflare.com/ (right sidebar on any page)
CLOUDFLARE_ACCOUNT_ID="YOUR_ACCOUNT_ID"

# Cloudflare D1 Database ID
# Create with: wrangler d1 create crosspad-demo
# Get ID from: https://dash.cloudflare.com/ -> Workers & Pages -> D1
CLOUDFLARE_DB_ID="YOUR_DATABASE_ID"

# Cloudflare API Token (optional - for remote operations)
# Create at: https://dash.cloudflare.com/profile/api-tokens
# Required permissions: D1:Edit, R2:Edit, KV:Edit, Workers:Edit
# These permissions are required to run some scripts and for db operations like migrations
CLOUDFLARE_API_TOKEN="YOUR_API_TOKEN"

# ============================================================================
# SECRETS - Must be set via Wrangler CLI (not in .env for production!)
# ============================================================================
# wrangler secret put works only after setting wrangler.jsonc (Set it first) and logging properly by wrangler login!
# These values are sensitive and should be stored securely in Cloudflare.
# Run the following commands separately to set them:
#
#   wrangler secret put JWT_PRIVATE_KEY
#   wrangler secret put JWT_PUBLIC_KEY
#   wrangler secret put MAILER_API_KEY
#   wrangler secret put PRIV_API_KEY
#
# For local development, you can keep them in .env (gitignored).
# ============================================================================

# JWT Private Key (base64 encoded RSA private key)
# Generate automatically with: pnpm script encode-keys
# Creates .secrets/JWT_PRIVATE_KEY.pem and .secrets/JWT_PUBLIC_KEY.pem, then encodes to base64
# ⚠️ SET VIA: wrangler secret put JWT_PRIVATE_KEY
JWT_PRIVATE_KEY="YOUR_BASE64_PRIVATE_KEY"

# JWT Public Key (base64 encoded RSA public key)
# Generated automatically with: pnpm script encode-keys (same command as above)
# ⚠️ SET VIA: wrangler secret put JWT_PUBLIC_KEY
JWT_PUBLIC_KEY="YOUR_BASE64_PUBLIC_KEY"

# Private API Key (for secure internal/admin API communication)
# Generate with: pnpm script generate-api-key
# Used for safe connection between CLI commands and API endpoints
# ⚠️ SET VIA: wrangler secret put PRIV_API_KEY
PRIV_API_KEY="YOUR_API_KEY"

# MailerSend API Key (for email functionality)
# Get from: https://www.mailersend.com/ -> API Tokens
# ⚠️ SET VIA: wrangler secret put MAILER_API_KEY
MAILER_API_KEY="YOUR_MAILER_API_KEY"
`;

export function generateEnv(): void {
  const outputPath = resolve(process.cwd(), ".env");

  if (existsSync(outputPath)) {
    console.log("\n  ⚠️  .env already exists, overwriting...\n");
  }

  writeFileSync(outputPath, ENV_CONTENT, "utf-8");

  console.log("\n  ✅ Generated .env\n");
  console.log("  📄 File: .env");
  console.log("  📝 Next steps:");
  console.log("     1. Fill in your values");
  console.log("     2. Run: pnpm script encode-keys (to generate JWT keys)\n");
}

// Run if called directly
generateEnv();
