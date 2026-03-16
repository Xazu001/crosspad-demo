---
trigger: model_decision
description: When importing ts modules. Path alias configuration and usage.
---

# Import Aliases

Defined in `tsconfig.cloudflare.json`. Use aliases for clean imports across the codebase.

## Aliases

| Alias | Maps to      | Scope  | Description                                                 |
| ----- | ------------ | ------ | ----------------------------------------------------------- |
| `#/`  | `./app/*`    | App    | Client components, hooks, stores, routes + RouteService     |
| `$/`  | `./server/*` | Server | Pure server: services, database, decorators, responses      |
| `@/`  | `./shared/*` | Shared | Constants, validators, utilities, types (both server & app) |

## Scope Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           IMPORT BOUNDARY RULES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FROM              CAN IMPORT              CANNOT IMPORT                        │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  server/           $/*, @/*                #/* (app)                            │
│  (pure server)                          Server never imports from app           │
│                                                                                 │
│  app/              #/*, @/*, $/*          —                                    │
│  (hybrid)           App imports server for RouteService, decorators            │
│                     App imports shared for validators, constants               │
│                                                                                 │
│  shared/           @/* only               #/*, $/*                             │
│  (shared)           Shared imports nothing from app or server                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Usage Examples

### App Imports (`#/`)

**Client-side:**

```typescript
// Components
import { KitCard } from "#/components/custom/kit-card";
import { Button } from "#/components/ui/button";
// Hooks
import { usePadController } from "#/lib/hooks";
// Router helpers
import { useSubmitForm } from "#/lib/router";
// Stores
import { useCreateKitStore } from "#/lib/stores";
// Utilities
import { getAvatarUrl } from "#/lib/utils";
```

**Server-side in app (RouteService):**

```typescript
// In app/routes/*/settings.tsx or settings.server.tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { data } from "react-router";
```

### Server Imports (`$/`)

```typescript
// Core types
import { Database, Services } from "$/core";
// Database
import { db } from "$/database";
// Cookies
import { cookies } from "$/lib/cookies";
// Crypto
import { hashPassword, verifyPassword } from "$/lib/crypto";
// Decorators (also used in RouteService in app/)
import { createRouteService, dataMethod, formMethod, loaderMethod } from "$/lib/decorators";
// Mail
import { sendMail } from "$/lib/mail";
// Response helpers
import { apiError, apiSuccess, formError, formSuccess, responses } from "$/lib/response";
// Utils
import { optimizeImage } from "$/lib/utils";
import { AuthService } from "$/services/auth";
// Services
import { BaseService } from "$/services/base";
import { KitService } from "$/services/kit";
```

### Shared Imports (`@/`)

Used by **both** server and app:

```typescript
// Constants
import { SITE_NAME, SITE_URL } from "@/constants";
// Enums
import { KitStatus } from "@/enums";
// Types
import type { TypedSubmit } from "@/types";
// Utilities
import { createTypedSubmit, parseTypedSubmit } from "@/utils";
// Validators
import { loginSchema, registerSchema } from "@/validators";
```

## Rules

- **Always use aliases** instead of relative imports across directories
- **Never mix** — don't use `../server/` when `$/` exists
- **Within same directory** — relative imports are fine (e.g., `./utils`)
- **Route types** — use generated types from `./+types/route-name`
- **Server → App** — **NEVER** import from `#/` in `server/` code
- **App → Server** — **OK** to import from `$/` in RouteService (app/routes/)
- **Shared** — **NEVER** imports from `#/` or `$/` (shared is isolated)

## RouteService Import Pattern

RouteService lives in `app/routes/` but imports from `$/`:

```typescript
// app/routes/profile/settings.tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { data } from "react-router";
import { redirect } from "react-router";

import type { Route } from "./+types/settings";

class RouteService extends BaseService {
  // Uses server-side patterns from server.md
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  // ...
}
```

**Why RouteService imports from `$/`:**

- Extends `BaseService` from `$services/base`
- Uses decorators from `$/lib/decorators`
- Uses response helpers from `$/lib/response`
- Follows server-side patterns defined in `server.md`

### Additional Rules

- **Scripts** (`scripts/`) use relative paths: `../shared/constants`
- **React Router `+types`** stay relative: `import type { Route } from "./+types/index"`
