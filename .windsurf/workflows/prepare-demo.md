---
description: Prepare repository for demo release (remove sensitive data)
auto_execution_mode: 3
---

# Prepare Demo Release

Convert repository to public demo version by removing sensitive files and replacing secrets with placeholders.

## 1. Remove Sensitive Files

Delete production config files (YOU HAVE TO DELETE THEM):

```bash
# Remove wrangler configs
rm wrangler.jsonc
rm wrangler.dev.jsonc
rm wrangler.prod.jsonc

# Remove drizzle configs
rm drizzle.config.dev.ts
rm drizzle.config.prod.ts
rm drizzle.config.ts

# Remove drizzle migrations (user will generate fresh ones)
rm -rf drizzle/*

# Remove build artifacts and dependencies
rm -rf .build
rm -rf node_modules
rm -rf packages/midifun/node_modules
```

## 2. Clean vite.config.ts

Remove `dev` environment support:

**Update AppEnv type (line 9):**

- `type AppEnv = "local" | "dev" | "prod";` → `type AppEnv = "local" | "prod";`

**Update APP_ENV_VALUES (line 11):**

- `const APP_ENV_VALUES: AppEnv[] = ["local", "dev", "prod"];` → `const APP_ENV_VALUES: AppEnv[] = ["local", "prod"];`

**Update resolveAppEnv function (lines 13-25):**

Remove `dev` references, keep only `local` and `prod` logic.

**Update HMR config (line ~125):**

- `host: "192.168.0.159"` → `host: "localhost"`

---

## 4. Clean shared/constants/site.ts

Simplify URL maps and remove `dev` environment:

**Find (lines 8-24):**

```typescript
type AppEnv = "local" | "dev" | "prod";

const siteUrlMap: Record<AppEnv, string> = {
  local: "http://192.168.0.159:5173",
  dev: "https://dev.crosspad.app",
  prod: "https://new.crosspad.app",
};

export const SITE_URL = siteUrlMap[__APP_ENV__];

const r2UrlMap: Record<AppEnv, string> = {
  local: "https://r2x-dev.crosspad.app",
  dev: "https://r2x-dev.crosspad.app",
  prod: "https://r2x.crosspad.app",
};

export const R2_URL = r2UrlMap[__APP_ENV__];
```

**Replace with:**

```typescript
type AppEnv = "local" | "prod";

const siteUrlMap: Record<AppEnv, string> = {
  local: "http://localhost:5173",
  prod: "XXXXXX",
};

export const SITE_URL = siteUrlMap[__APP_ENV__];

const r2UrlMap: Record<AppEnv, string> = {
  local: "XXXXXX",
  prod: "XXXXXX",
};

export const R2_URL = r2UrlMap[__APP_ENV__];
```

**Also update the declare statement (line 2):**

- `declare const __APP_ENV__: "local" | "dev" | "prod";` → `declare const __APP_ENV__: "local" | "prod";`

**Also update APP_GTAG (line 4):**

- `export const APP_GTAG = "G-541BBH2P4B";` → `export const APP_GTAG = "G-XXXXXX";`

---

## 5. Clean shared/constants/legal.ts

Replace personal data with placeholders in `shared/constants/legal.ts`:

**Find and replace:**

- `SERVICE_ADMIN_FULL_NAME: "Kacper Kijek"` → `SERVICE_ADMIN_FULL_NAME: "XXXXXX"`
- `SERVICE_ADMIN_ADDRESS: "Budy Czarnockie 32, Piątnica Poduchowna 18-421, Polska"` → `SERVICE_ADMIN_ADDRESS: "XXXXXX"`
- `SERVICE_ADMIN_EMAIL: "xazu.work@gmail.com"` → `SERVICE_ADMIN_EMAIL: "XXXXXX"`

## 6. Verify Changes

Check that all placeholders are in place:

```bash
# Verify no real URLs remain
grep -r "crosspad\.app" shared/constants/
grep -r "192\.168\.0\.159" shared/constants/

# Verify no personal data remains
grep -r "Kacper" shared/constants/
grep -r "xazu\.work" shared/constants/
```

---

## 7. Clean package.json Scripts

**Scripts to DELETE (production-related):**

```json
"build:prod"
"dev:wrangler"
"dev:wrangler:prod"
"deploy:prod"
"deploy:only"
"deploy:only:prod"
"deploy:data:prod"
"db:full:prod"
```

**Scripts to MODIFY:**

```json
"build"
```

**Change from:**

```json
"build": "cross-env APP_ENV=dev CLOUDFLARE_ENV=dev react-router build"
```

**Change to:**

```json
"build": "cross-env APP_ENV=prod CLOUDFLARE_ENV=prod react-router build"
```

> **Note:** Build should use `prod` env for proper deployment. The demo only supports `local` (dev server) and `prod` (deployment).

**Scripts to KEEP (demo-appropriate):**

```json
"dev"
"dev:clean"
"build"
"preview"
"typegen"
"typecheck"
"db:full"
"fmt"
"fmt:sort"
"fmt:style"
"lint"
"lint:fix"
"script"
"build:midifun"
"dev:midifun"
"predev"
"postinstall"
"deploy"
"deploy:data"
"cron:test"
```

> **Note:** `deploy` and `deploy:data` are kept for deploying the demo to user's own Cloudflare account.
