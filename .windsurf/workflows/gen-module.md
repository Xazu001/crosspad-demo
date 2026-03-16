---
description: Generate any module following project standards (routes, services, components, API endpoints, cron handlers, etc.)
auto_execution_mode: 3
---

# Generate Module

Create any module type following project standards. This workflow adapts based on what you're building.

## 1. Identify Module Type

Determine what you're creating:

### Server-Side Modules

| Type              | Location                            | Runs where  | Rules to read          |
| ----------------- | ----------------------------------- | ----------- | ---------------------- |
| **Service**       | `server/services/*.ts`              | Server only | `server.md`, `core.md` |
| **API endpoint**  | `server/api/*/`                     | Server only | `server.md`            |
| **Cron handler**  | `server/cloudflare/crons/handlers/` | Server only | `server.md`            |
| **Queue handler** | `server/cloudflare/queue/handlers/` | Server only | `server.md`            |

### App Modules (Client + Server Hybrid)

| Type                 | Location                           | Runs where                       | Rules to read                |
| -------------------- | ---------------------------------- | -------------------------------- | ---------------------------- |
| **Route**            | `app/routes/*/`                    | Both (component + loader/action) | `app.md`, `server.md`        |
| **RouteService**     | Inside route file or `.server.tsx` | Server only                      | `app.md`, `server.md`        |
| **UI component**     | `app/components/ui/`               | Client only                      | `components.md`, `tokens.md` |
| **Custom component** | `app/components/custom/`           | Client only                      | `components.md`, `tokens.md` |
| **Hook**             | `app/lib/hooks/`                   | Client only                      | `app.md`                     |
| **Store**            | `app/lib/stores/`                  | Client only                      | `app.md`                     |

### Shared Modules

| Type            | Location             | Rules to read |
| --------------- | -------------------- | ------------- |
| **Shared util** | `shared/utils/`      | `core.md`     |
| **Validator**   | `shared/validators/` | `core.md`     |
| **Constants**   | `shared/constants/`  | `core.md`     |

## 2. Read Relevant Rules

Always read `aliases.md` for import paths. Then read module-specific rules from the tables above.

**Key distinction:**

- **Pure server** (`server/`) → Never imports from `#/` (app)
- **App server-side** (RouteService) → Lives in `app/routes/`, imports from `$/`
- **Client-only** (components, hooks, stores) → Never uses server decorators

## 3. Choose Response System

The project has four distinct response systems. Choose based on context:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          RESPONSE SYSTEM DECISION                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Where is this code?                                                            │
│      │                                                                          │
│      ├─ ROUTE ACTION (app/routes/)                                              │
│      │       └──► FormResponse via decorators                                   │
│      │           • @formMethod → this.formSuccess() / this.throw()             │
│      │           • Route dispatch → route.formError()                          │
│      │                                                                          │
│      ├─ ROUTE LOADER (app/routes/)                                              │
│      │       └──► Data via decorators                                          │
│      │           • @dataMethod → this.ok() / this.throw(Response)              │
│      │           • Wrap with data() in loader                                   │
│      │                                                                          │
│      ├─ REST API (server/api/)                                                  │
│      │       └──► ApiResponse                                                   │
│      │           • apiSuccess(data) / apiError(message, status)                 │
│      │                                                                          │
│      └─ QUEUE HANDLER (server/cloudflare/queue/)                                │
│              └──► QueueResult                                                   │
│                  • queueOk(data) / queueFailed(message, retry?)                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Form Response (Route Actions)

```tsx
// In RouteService @formMethod — use this.formSuccess/this.throw
@formMethod({ general: "Operation failed" })
async doAction(request: Request) {
  if (!valid) this.throw({ email: "Invalid email", general: "Failed" });
  return this.formSuccess({ user });
}

// In route dispatch (multi-intent) — use route.formError()
const route = createRouteService(RouteService, context);
return data(route.formError({ general: "Unknown action" }));
```

### Data Response (Route Loaders)

```tsx
// In RouteService @dataMethod — use this.ok/this.throw(Response)
@dataMethod()
async getData(request: Request) {
  const user = await this.auth.getUserFromRequest(request);
  if (!user) throw redirect("/login");

  const data = await this.exDbOperation(() =>
    this.db.op.selectFrom("kits").execute()
  );

  return this.ok({ user, kits: data });
}

// In loader — wrap with data()
export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getData(request);
  return data(result);
}
```

### API Response (REST Endpoints)

```tsx
import { apiError, apiSuccess } from "$/lib/response";

// Success with data
return c.json(apiSuccess({ user }));

// Error with message
return c.json(apiError("Not found", 404), 404);
```

### Queue Result (Background Workers)

```tsx
import { queueFailed, queueOk } from "$/cloudflare";

// Success
return queueOk({ processed: true });

// Failure
return queueFailed("Processing failed", { retry: true });
```

## 4. Create Module

### Route (component + RouteService + loader/action)

All loaders and actions should use `createRouteService(RouteService, context)`:

```tsx
// app/routes/path/route-name.tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { data } from "react-router";

import type { Route } from "./+types/route-name";

// ──────────────────────────────────────────────────────────────
// RouteService (server-side logic in app)
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    const result = await this.kit.getById(request);
    return this.ok(result);
  }

  @formMethod({ general: "Operation failed" })
  async doAction(request: Request) {
    await this.rateLimit(request);
    return await this.kit.create(request);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader & Action
// ──────────────────────────────────────────────────────────────

export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getData(request);
  return data(result);
}

export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.doAction(request);
  return data(result);
}

// ──────────────────────────────────────────────────────────────
// Component (client-side)
// ──────────────────────────────────────────────────────────────

export default function RouteName({ loaderData }: Route.ComponentProps) {
  return <div>{/* content */}</div>;
}
```

### Split RouteService File (MANDATORY for ALL RouteService)

**ALL routes with RouteService must be split into two files:**

```
app/routes/main/kit/edit/
├── edit.tsx           # Client component + re-exports
└── edit.server.tsx    # RouteService + loader + action
```

**`edit.server.tsx`:**

```tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { data } from "react-router";

import type { Route } from "./+types/edit";

class RouteService extends BaseService {
  // ... long implementation (100+ lines)
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  // ...
}

export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  // ...
}
```

**`edit.tsx`:**

```tsx
import { useLoaderData } from "react-router";

// Re-export for React Router route discovery
export { loader, action } from "./edit.server";

export default function EditKit() {
  const loaderData = useLoaderData<typeof loader>();
  // ...
}
```

### Service Method (Pure Server)

```tsx
// server/services/kit/index.ts (add to existing class)
import { dataMethod, formMethod } from "$/lib/decorators";

// For loaders: @dataMethod() + return ok(data) or none()
@dataMethod()
async getById(id: string) {
  const kit = await this.exDbOperation(() =>
    this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
  );
  if (!kit) return this.none();
  return this.ok(kit);
}

// For actions: @formMethod() + formSuccess/this.throw()
@formMethod({ general: "Failed to create kit" })
async create(request: Request) {
  const formData = await request.formData();
  // ... validation
  if (!valid) this.throw({ general: "Invalid data" });

  const result = await this.exDbOperation(() =>
    this.db.op.insertInto("kits").values({ ... }).executeTakeFirst()
  );
  return this.formSuccess({ id: result.id });
}
```

### API Endpoint (Pure Server)

```tsx
// server/api/priv/resource/action.ts
import { createHonoApp } from "$/lib/hono-utils";
import { apiError, apiSuccess } from "$/lib/response";
import { authMiddleware } from "$/middleware/auth";

const app = createHonoApp();
app.use("*", authMiddleware);

app.post("/", async (c) => {
  const services = c.get("services");
  const result = await services.user.doSomething();

  if (!result) {
    return c.json(apiError("Not found", 404), 404);
  }

  return c.json(apiSuccess(result));
});

export default app;
```

### Cron Handler (Pure Server)

```tsx
// server/cloudflare/crons/handlers/my-cron.ts
import type { CronHandler } from "../types";

export const myCronHandler: CronHandler = {
  name: "my-cron",
  description: "Does something on schedule",
  async handler(controller, env, ctx) {
    // Process scheduled task (no return value)
  },
};

// Register in server/cloudflare/crons/registry.ts
```

### UI Component (Client Only)

```tsx
// app/components/ui/component-name.tsx
import * as React from "react";
import { cn, createVariants, type VariantProps } from "#/lib/utils/component-utils";
import "./component-name.style.scss";

const componentVariants = createVariants("component-name", {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "primary", size: "md" },
});

export { ComponentName, componentVariants };
```

### Co-located SCSS

```scss
// Same directory as component: component-name.style.scss
@use "@abstracts" as *;

.component-name {
  // BEM: .component-name__element, .component-name--modifier
  // Use tokens: $color-primary, $text-md
}
```

## 5. Checklist

### All Modules

- [ ] Correct file naming (`kebab-case.tsx`, `camelCase` for hooks/stores)
- [ ] Import aliases used (`#/`, `$/`, `@/`)
- [ ] Correct scope (server never imports from app)

### Routes (App Server-Side)

- [ ] Types from `+types` for routes
- [ ] RouteService extends `BaseService`
- [ ] Decorators: `@dataMethod()` for loaders, `@formMethod()` for actions
- [ ] Returns: `this.ok()`/`this.none()` for data, `this.formSuccess()`/`this.throw()` for forms
- [ ] Loader wraps result with `data()`
- [ ] Multiple actions use `typed-submit.ts`

### Services (Pure Server)

- [ ] Services accessed via `context.services.*` in routes
- [ ] DB accessed via `this.db.op/cf/dr` in services
- [ ] Same decorator patterns as RouteService

### Components (Client Only)

- [ ] Component uses `createVariants()` if variants needed
- [ ] SCSS co-located, uses BEM + tokens
- [ ] No server imports (no `$/lib/decorators`)
