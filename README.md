# Crosspad

Interactive music pad platform for creating, sharing, and playing sound kits in the browser. Build custom sound kits with your own audio samples, share them with the community, and play them in real-time — all in the browser with no installation required.

---

## Demo Version

This repository also provides a **demo version** for self-hosting. See **[README.DEMO.md](./README.DEMO.md)** for complete setup instructions.

> **Note:** You can use the demo version for **any purpose** — personal projects, commercial products, learning, or internal use. See [License](#license) for branding requirements.

**What this README covers:**

- Full application description and architecture
- Project structure (complete, not demo-specific)
- Full development setup (Cloudflare, database, secrets)
- Deployment to production environments

**What README.DEMO.md covers:**

- Quick demo setup guide
- Cloudflare resource creation
- Configuration customization
- Troubleshooting for demo deployment

---

## Tech Stack

| Layer               | Technology                                    |
| ------------------- | --------------------------------------------- |
| **Framework**       | React Router v7 (SSR)                         |
| **Runtime**         | Cloudflare Workers                            |
| **Database**        | D1 (SQLite) via Kysely + Drizzle (migrations) |
| **Storage**         | R2 (audio/images), KV (cache)                 |
| **Server**          | Hono middleware → React Router handler        |
| **Auth**            | JWT (RS256) with cookie sessions              |
| **Styling**         | SCSS (BEM, mostly co-located files)           |
| **State**           | Zustand stores                                |
| **3D/Shaders**      | Three.js, React Three Fiber                   |
| **Animation**       | GSAP, Framer Motion, Anime.js                 |
| **Validation**      | Zod (shared app + server)                     |
| **Email**           | React Email + MailerSend                      |
| **Testing**         | Vitest + Testing Library (No setup yet)       |
| **Package Manager** | pnpm ("monorepo" with `packages/midifun`)     |

## Quick Start

```bash
pnpm install
npx wrangler login
pnpm dev              # http://localhost:5173
```

## Environment

`.env` file (For local development):

```env
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_DB_ID="..."
CLOUDFLARE_DB_PROD_ID="..."
CLOUDFLARE_API_TOKEN="..."

PRIV_API_KEY="..."

MAILER_API_KEY="..."
```

### Getting Environment Variables

| Variable                | Where to get                                                  | Purpose                                                  |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Right sidebar                          | Account identifier for API access                        |
| `CLOUDFLARE_DB_ID`      | Cloudflare Dashboard → Workers & Pages → D1 → Database ID     | D1 database for dev environment                          |
| `CLOUDFLARE_DB_PROD_ID` | Same as above (prod database)                                 | D1 database for production                               |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare Dashboard → My Profile → API Tokens → Create Token | API token with D1, R2, KV, Queue permissions             |
| `PRIV_API_KEY`          | Generate secure random string                                 | Private API key for internal endpoints                   |
| `MAILER_API_KEY`        | MailerSend Dashboard → API Tokens                             | Send transactional emails (verification, password reset) |

### Cloudflare Secrets

JWT keys are stored as encrypted secrets (not in `.env`):

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Set as secrets
wrangler secret put JWT_PRIVATE_KEY --env dev    # Paste private.pem content
wrangler secret put JWT_PUBLIC_KEY --env dev     # Paste public.pem content
wrangler secret put JWT_PRIVATE_KEY --env prod
wrangler secret put JWT_PUBLIC_KEY --env prod
```

**Purpose:** RS256 JWT signing for authentication sessions (more secure than HS256).

## Scripts

| Command             | Purpose                             |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Dev server (port 5173, local env)   |
| `pnpm build`        | Build for **dev** environment       |
| `pnpm build:prod`   | Build for **prod** environment      |
| `pnpm deploy`       | Build (dev) + deploy to Cloudflare  |
| `pnpm deploy:prod`  | Build (prod) + deploy to Cloudflare |
| `pnpm typecheck`    | Full type check                     |
| `pnpm db:full`      | Generate + apply migrations (dev)   |
| `pnpm db:full:prod` | Generate + apply migrations (prod)  |
| `pnpm fmt`          | Format code (Oxlint)                |
| `pnpm fmt:sort`     | Sort imports (Prettier)             |
| `pnpm fmt:style`    | Format SCSS (Stylelint)             |
| `pnpm lint`         | Check lint errors (Oxlint)          |
| `pnpm script`       | Interactive script runner           |

## Project Structure

```
crosspad/
├── app/                        # Client-side (Excluding React Router Actions and Loaders)
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Modal, Select...)
│   │   ├── custom/             # Business components (KitCard, Navigation...)
│   │   └── pages/              # Page-specific component groups
│   ├── lib/
│   │   ├── hooks/              # usePadController, useIsMobile, useMetronome...
│   │   ├── stores/             # Zustand (createKit, editKit, playKit)
│   │   ├── shader/             # ShaderCanvas, extendMaterial, GLSL noise
│   │   └── utils/              # SEO, component-utils, router-helpers
│   ├── routes/
│   │   ├── auth/               # Login, register, logout
│   │   ├── legal/              # Landing, blog, legal pages
│   │   ├── main/               # Home, kit editing, kit playing
│   │   └── profile/            # User settings, notifications
│   └── style/                  # Global SCSS (abstracts, base, legacy components)
│
├── server/                     # Server-side (Cloudflare Workers)
│   ├── services/               # Auth, User, Kit services (extend BaseService)
│   ├── api/                    # Hono API routes (/api/*)
│   ├── cloudflare/
│   │   ├── crons/              # Scheduled handlers (registry pattern)
│   │   ├── queue/              # Queue consumer/producer
│   │   └── kv/                 # KV cache managers
│   ├── database/               # Drizzle schema, table types
│   └── setup.ts                # Hono app factory, services middleware
│
├── shared/                     # Shared between app + server
│   ├── validators/             # Zod schemas
│   ├── constants/              # SITE_URL, categories
│   ├── enums/                  # Shared enums
│   └── utils/                  # typed-submit, formData helpers
│
├── packages/midifun/           # MIDI utility package (monorepo)
├── drizzle/                    # Generated migration files
├── scripts/                    # One-off scripts (run via `pnpm script`)
├── worker.ts                   # Worker entry: fetch + queue + cron handlers
└── wrangler.jsonc              # Cloudflare config (dev + prod environments)
```

## Import Aliases

| Alias | Maps to      | Scope                               |
| ----- | ------------ | ----------------------------------- |
| `#/*` | `./app/*`    | Client components, hooks, styles    |
| `$/*` | `./server/*` | Server-only code                    |
| `@/*` | `./shared/*` | Shared validators, utils, constants |

## Architecture

**Request flow:** Browser → Cloudflare Worker → Hono middleware (creates services) → React Router handler (loaders/actions access `context.services.*`)

**Services pattern:** All services extend `BaseService` with access to `db.op` (Kysely), `db.cf` (raw D1), `db.dr` (Drizzle). Services get cross-service access via `ServiceContainer`.

**Cloudflare bindings:** D1 (`db`), R2 (`r2`), KV (`kv`), Queues (`queue`), Assets (`ASSETS`) — configured per environment in `wrangler.jsonc`.

**Queues & Scheduled Jobs:**

- Queue consumer processes batches (max 10) with dead-letter queue
- Cron jobs registered in `server/cloudflare/crons/registry.ts`
- Scheduled handlers run via `worker.ts` → `getCronHandler()`

## Database

Schema in `server/database/schema.ts` (Drizzle). Queries use Kysely.

Separate Drizzle configs for each environment:

- `drizzle.config.dev.ts` → `CLOUDFLARE_DB_ID`
- `drizzle.config.prod.ts` → `CLOUDFLARE_DB_PROD_ID`

```bash
# Edit schema → generate → migrate
pnpm db-generate        # Generates migration files (uses dev config)
pnpm db-migrate         # Apply to dev
pnpm db-migrate-prod    # Apply to prod

# Or combined commands
pnpm db-full            # Generate + migrate dev
pnpm db-full-prod       # Generate + migrate prod
```

## Deployment

Three environments configured in diffrent `wrangler.jsonc` files:

|           | Worker         | D1               | R2               | Queue            |
| --------- | -------------- | ---------------- | ---------------- | ---------------- |
| **local** | `crosspad-dev` | `crosspad-x-dev` | `crosspad-x-dev` | `crosspad-x-dev` |
| **dev**   | `crosspad-dev` | `crosspad-x-dev` | `crosspad-x-dev` | `crosspad-x-dev` |
| **prod**  | `crosspad`     | `crosspad-x`     | `crosspad-x`     | `crosspad-x`     |

```bash
pnpm deploy              # → dev
pnpm deploy-prod         # → prod
```

## Dev Rules

Development standards are documented in `.windsurf/rules/` — see `README.md` there for the full index.

## License

This project is licensed under the [MIT License](./LICENSE) — **free for any use case**.

**You are free to:**

- Use for personal, commercial, or any other purposes
- Modify, customize, and build upon the code
- Deploy to your own infrastructure

**Requirements:**

- Include a copy of the LICENSE file in your repository
- Provide attribution to the original author (Kacper Kijek / Xazu)
- **Commercial/public use:** Rebrand with your own name and logo (cannot use "Crosspad" branding)
