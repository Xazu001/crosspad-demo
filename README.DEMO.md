# Crosspad Demo Setup Guide

Complete guide for configuring the Crosspad demo version.

---

## System Requirements

| Requirement        | Version   | Notes                        |
| ------------------ | --------- | ---------------------------- |
| Node.js            | 20+       |                              |
| pnpm               | 8+        | `npm install -g pnpm`        |
| Wrangler CLI       | 4+        | `pnpm add -g wrangler`       |
| Cloudflare Account | Free tier | https://dash.cloudflare.com/ |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Xazu001/crosspad-demo.git
cd crosspad-demo
pnpm install
```

### 2. Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login
```

### 3. Generate Configuration Files

```bash
# Generate .env with placeholders
pnpm script demo/generate-env-example

# Generate wrangler.jsonc with placeholders
pnpm script demo/generate-wrangler-template

# Generate drizzle.config.ts with placeholders
pnpm script demo/generate-drizzle-config
```

And run this if you want to!

```bash
# Delete comments from wrangler.jsonc and .env
pnpm script demo/delete-comments
```

### 4. Create Cloudflare Resources

```bash
# D1 Database
wrangler d1 create crosspad-demo
# → Copy database_id to wrangler.jsonc

# R2 Bucket
wrangler r2 bucket create crosspad-demo

# KV Namespace
wrangler kv:namespace create crosspad-demo
# → Copy id to wrangler.jsonc

# Queue (main)
wrangler queue create crosspad-demo

# Queue (dead letter)
wrangler queue create crosspad-demo-dlq
```

### 5. Set Secrets

```bash
# Generate JWT keys
pnpm script encode-keys

# Set secrets in Cloudflare
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
wrangler secret put PRIV_API_KEY
wrangler secret put MAILER_API_KEY  # optional but recommended to get emails! If you want to you can setup other email providers like Resend or SendGrid in the code.
```

### 6. Run Database Migrations

```bash
pnpm db:full
```

### 7. Start Development Server

```bash
pnpm dev
```

---

## Configuration Files

### `.env`

| Variable                | Description                        | Required |
| ----------------------- | ---------------------------------- | -------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID              | ✅       |
| `CLOUDFLARE_DB_ID`      | D1 database ID                     | ✅       |
| `CLOUDFLARE_API_TOKEN`  | API token                          | ✅       |
| `JWT_PRIVATE_KEY`       | RSA private key (base64)           | ✅       |
| `JWT_PUBLIC_KEY`        | RSA public key (base64)            | ✅       |
| `PRIV_API_KEY`          | API key for internal communication | ✅       |
| `MAILER_API_KEY`        | MailerSend key (optional)          | ❌       |

### `wrangler.jsonc`

| Field                          | Description           | Where to Find                    |
| ------------------------------ | --------------------- | -------------------------------- |
| `account_id`                   | Cloudflare account ID | Dashboard → right sidebar        |
| `name`                         | Worker name           | Any name you choose              |
| `CONTACT_EMAIL`                | Contact email         | Any email                        |
| `d1_databases[].database_id`   | D1 database ID        | `wrangler d1 list`               |
| `d1_databases[].database_name` | Database name         | From `wrangler d1 create`        |
| `r2_buckets[].bucket_name`     | R2 bucket name        | From `wrangler r2 bucket create` |
| `kv_namespaces[].id`           | KV namespace ID       | `wrangler kv:namespace list`     |
| `queues[].queue`               | Queue name            | From `wrangler queue create`     |

---

## Customizing `shared/constants/`

### `shared/constants/site.ts`

**Fields to change:**

```typescript
// Site URLs — change to your own domains
const siteUrlMap: Record<AppEnv, string> = {
  local: "http://localhost:5173", // ← Local development
  prod: "https://your-domain.com", // ← Your production domain
};

// R2 URLs — change to your own bucket
const r2UrlMap: Record<AppEnv, string> = {
  prod: "https://your-r2.your-domain.com", // ← Your R2 public URL
};

// Google Analytics — change to your own ID or remove
export const APP_GTAG = "G-XXXXXXXXXX"; // ← Your GA ID
```

### `shared/constants/legal.ts`

**Fields to change:**

```typescript
export const LEGAL_CONSTANTS = {
  SERVICE_OWNER: "Your Team Name", // ← Your team name
  SERVICE_OWNER_KRS: "0000000000", // ← Your KRS (if applicable)
  SERVICE_ADMIN_FULL_NAME: "Your Name", // ← Your full name
  SERVICE_ADMIN_ADDRESS: "Your Address", // ← Your address
  SERVICE_ADMIN_EMAIL: "your@email.com", // ← Your email
} as const;
```

**Note:** This data appears in terms of service and privacy policy.

### `shared/constants/kit.ts`

**Fields to change (optional):**

```typescript
// Default kit colors — customize for your branding
const mainColor = "#96DE2C"; // ← Your main color

export const DEFAULT_KIT_COLORS: KitColors = {
  main: mainColor,
  mainHover: `${mainColor}d9`,
  mainForeground: "#000",
  border: "transparent",
  card: "#171A26",
  cardBorder: "#40434F",
  background: "#0F111B",
  foreground: "#efefef",
};
```

### `shared/constants/categories.ts`

**No changes needed** — categories are universal (Drums, Bass, Synth, etc.).

### `shared/constants/resource.ts`

**No changes needed** — R2 directory structure is standard.

---

## `package.json` Scripts

### Development

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start dev server (localhost:5173) |
| `pnpm dev:clean`   | Clear Vite cache + start dev      |
| `pnpm build`       | Build application                 |
| `pnpm preview`     | Preview build                     |
| `pnpm deploy`      | Build and deploy to Cloudflare    |
| `pnpm deploy:data` | Deploy with public/data folder    |

### Database

| Command        | Description                     |
| -------------- | ------------------------------- |
| `pnpm db:full` | Generate migrations + run on D1 |
| `pnpm typegen` | Generate Wrangler types         |

### Code Quality

| Command          | Description             |
| ---------------- | ----------------------- |
| `pnpm typecheck` | Check TypeScript types  |
| `pnpm fmt`       | Format code (Oxlint)    |
| `pnpm fmt:sort`  | Sort imports (Prettier) |
| `pnpm fmt:style` | Format SCSS (Stylelint) |
| `pnpm lint`      | Check ESLint errors     |
| `pnpm lint:fix`  | Fix ESLint errors       |

### Scripts Runner

| Command                                       | Description                  |
| --------------------------------------------- | ---------------------------- |
| `pnpm script`                                 | Interactive script menu      |
| `pnpm script demo/generate-env-example`       | Generate `.env`              |
| `pnpm script demo/generate-wrangler-template` | Generate `wrangler.jsonc`    |
| `pnpm script demo/generate-drizzle-config`    | Generate `drizzle.config.ts` |
| `pnpm script demo/delete-comments`            | Remove comments from files   |
| `pnpm script generate-api-key`                | Generate API key             |
| `pnpm script encode-keys`                     | Generate RSA keys + encode   |
| `pnpm script generate-robots`                 | Generate `robots.txt`        |
| `pnpm script generate-sitemap`                | Generate `sitemap.xml`       |

---

## Demo Scripts

Scripts in `scripts/demo/` folder:

| Script                          | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| `generate-env-example.ts`       | Creates `.env` with placeholders                  |
| `generate-wrangler-template.ts` | Creates `wrangler.jsonc` with placeholders        |
| `generate-drizzle-config.ts`    | Creates `drizzle.config.ts`                       |
| `delete-comments.ts`            | Removes comments from `.env` and `wrangler.jsonc` |

---

## Troubleshooting

### Error: `D1 database not found or other D1 Issues`

```bash
# Check if database_id in wrangler.jsonc is correct
wrangler d1 list
```

or just disable dev server and run it again!

### Error: `R2 bucket not found`

```bash
# Check if bucket_name in wrangler.jsonc is correct
wrangler r2 bucket list
```

### Error: `KV namespace not found`

```bash
# Check if id in wrangler.jsonc is correct
wrangler kv:namespace list
```

### Error: `JWT verification failed`

```bash
# Make sure keys are set as secrets
wrangler secret list

# If missing, set them again
wrangler secret put JWT_PUBLIC_KEY
```

---

## License

This demo is licensed under the [MIT License](./LICENSE) — **free for any use case**.

**You are free to:**

- Use for personal, commercial, or any other purposes
- Modify, customize, and build upon the code
- Deploy to your own Cloudflare account

**Requirements:**

- Include a copy of the LICENSE file in your repository
- Provide attribution to the original author (Kacper Kijek / Xazu)
- **Commercial/public use:** Rebrand with your own name and logo (cannot use "Crosspad" branding)
