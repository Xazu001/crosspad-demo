---
description: Extract service method logic from route into RouteService class
---

# Extract Route Service

Convert route loaders and actions to use the `RouteService` pattern with decorators.

## When to Use

**Every loader and action** should use `createRouteService(RouteService, context)`:

- Route has inline DB queries, cache operations, or service compositions
- Route has rate limiting + service call patterns
- Multi-intent actions need `route.formError()` for dispatch errors
- Any logic that should be reusable across routes

## Architecture Note

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ROUTESERVICE VS SERVICE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RouteService (app/routes/)          Service (server/services/)                │
│  ─────────────────────────           ──────────────────────────                │
│                                                                                 │
│  • Route-specific logic              • Reusable cross-route logic              │
│  • Lives in route file               • Lives in server/                        │
│  • Uses decorators                   • Uses decorators                          │
│  • Extends BaseService               • Extends BaseService                     │
│  • Created per-request               • Singleton in context.services           │
│                                                                                 │
│  RouteService CAN call services via this.auth, this.kit, this.user, etc.       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**RouteService lives in `app/routes/` but uses server-side patterns:**

- Extends `BaseService` from `$services/base`
- Uses decorators from `$/lib/decorators`
- Follows all patterns from `server.md`

## Steps

### 1. Identify Logic to Extract

Look for:

- `context.services.base.db.*` / `context.services.base.cache.*` calls
- `context.services.base.rateLimitForm()` patterns
- Multiple service calls composed together
- `context.services.base.formError()` calls → replace with `route.formError()`

### 2. Create RouteService Class

```typescript
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { redirect } from "react-router";

class RouteService extends BaseService {
  @dataMethod()
  async getData(request: Request) {
    // Auth check
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    // DB query via exDbOperation
    const kits = await this.exDbOperation(() =>
      this.db.op.selectFrom("kits").where("user_id", "=", user.user_id).execute()
    );

    return this.ok({ user, kits });
  }

  @formMethod({ general: "Operation failed" })
  async doAction(request: Request) {
    const formData = await request.formData();
    const name = formData.get("name") as string;

    // Validation
    if (!name || name.length < 3) {
      this.throw({ name: "Name must be at least 3 characters" });
    }

    // Rate limiting
    await this.rateLimit(request);

    // Business logic
    const result = await this.exDbOperation(() =>
      this.db.op.insertInto("kits").values({ name }).executeTakeFirst()
    );

    return this.formSuccess({ kitId: result.id });
  }
}
```

### 3. Update Loader/Action

```typescript
import { data } from "react-router";

// Loader
export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getData(request);
  return data(result);
}

// Single-intent action
export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.doAction(request);
  return data(result);
}

// Multi-intent action (typed submit) — dispatch stays in route
export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);
  if (!result) return data(route.formError({ general: "Invalid action" }));

  switch (result.type) {
    case "delete": {
      const res = await route.deleteKit(request);
      return data(res);
    }
    case "update": {
      const res = await route.updateKit(request);
      return data(res);
    }
    default:
      return data(route.formError({ general: "Unknown action" }));
  }
}
```

### 4. Remove Old Inline Logic

- Delete old `context.services.base.db.*` calls from loader/action
- Replace `context.services.base.rateLimitForm()` + `isSuccess` check → `this.rateLimit()` inside `@formMethod`
- Replace `context.services.base.formError()` → `route.formError()`
- Remove standalone `formError`/`formSuccess` imports if unused

---

# Decorator Reference

## Decorator Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DECORATOR DECISION TREE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Is this method called from a loader?                                           │
│      │                                                                          │
│      ├─ YES → Is it ONLY for this loader?                                       │
│      │       ├─ YES → @dataMethod()                                             │
│      │       │         return this.ok(data) / this.none()                       │
│      │       │         errors: this.throw(Response) or throw redirect()         │
│      │       │                                                                   │
│      │       └─ NO → @loaderMethod() (loader-only, not reusable)                │
│      │                 return this.ok(data) / this.none()                        │
│      │                                                                           │
│      └─ NO → Is it called from an action?                                       │
│              ├─ YES → @formMethod({ general: "..." })                           │
│              │         return this.formSuccess(data) / this.throw({ fields })   │
│              │                                                                   │
│              └─ NO → No decorator (helper method)                               │
│                        regular return, throw propagates to caller               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Decorator Comparison

| Decorator         | Used for | Success return           | Error throw              |
| ----------------- | -------- | ------------------------ | ------------------------ |
| `@dataMethod()`   | Loaders  | `this.ok(data)`          | `this.throw(Response)`   |
| `@loaderMethod()` | Loaders  | `this.ok(data)`          | `this.throw(Response)`   |
| `@formMethod()`   | Actions  | `this.formSuccess(data)` | `this.throw({ fields })` |
| None              | Helpers  | Regular return           | Regular throw            |

## When to Use Each

### `@dataMethod()` — Universal Data Fetching

Use for methods that fetch data for loaders AND can be reused:

```typescript
@dataMethod()
async getKitData(request: Request, kitId: string) {
  // Can be called from loader
  // Can be called from other RouteService methods
  const kit = await this.exDbOperation(() =>
    this.db.op.selectFrom("kits").where("id", "=", kitId).executeTakeFirst()
  );

  if (!kit) {
    this.throw(this.responses.getNotFound("Kit not found"));
  }

  return this.ok(kit);
}
```

### `@loaderMethod()` — Loader-Only

Use for methods that are **only** called from loaders:

```typescript
@loaderMethod()
async getPrivateData(request: Request) {
  // Only called from this loader
  // Not reusable elsewhere
  const data = await this.exDbOperation(() =>
    this.db.op.selectFrom("private_data").execute()
  );

  return this.ok(data);
}
```

### `@formMethod()` — Form Actions

Use for methods that handle POST/PUT/DELETE:

```typescript
@formMethod({ general: "Failed to create kit" })
async createKit(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name") as string;

  // Validation errors → this.throw({ fields })
  if (!name) {
    this.throw({ name: "Name is required" });
  }

  // Rate limiting (only in @formMethod)
  await this.rateLimit(request);

  // Business logic
  const result = await this.exDbOperation(() =>
    this.db.op.insertInto("kits").values({ name }).executeTakeFirst()
  );

  return this.formSuccess({ kitId: result.id });
}
```

### No Decorator — Helper Methods

Use for internal helper methods:

```typescript
private async validateKitName(name: string): Promise<boolean> {
  // No decorator - just a helper
  if (!name || name.length < 3) return false;
  return true;
}

@formMethod({ general: "Failed to create kit" })
async createKit(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name") as string;

  if (!(await this.validateKitName(name))) {
    this.throw({ name: "Invalid name" });
  }

  // ...
}
```

---

# Error Handling

## Error Types by Context

| Context        | Error type       | Method                                     |
| -------------- | ---------------- | ------------------------------------------ |
| `@dataMethod`  | HTTP error       | `this.throw(this.responses.getNotFound())` |
| `@dataMethod`  | Redirect         | `throw redirect("/path")`                  |
| `@formMethod`  | Validation error | `this.throw({ field: "msg" })`             |
| `@formMethod`  | General error    | `this.throw({ general: "msg" })`           |
| Route dispatch | Dispatch error   | `route.formError({ general: "msg" })`      |

## Error Examples

```typescript
class RouteService extends BaseService {
  @dataMethod()
  async getData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    // Redirect (idiomatic with throw)
    if (!user) throw redirect("/login");

    const kit = await this.exDbOperation(() =>
      this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
    );

    // HTTP error
    if (!kit) {
      this.throw(this.responses.getNotFound("Kit not found"));
    }

    return this.ok(kit);
  }

  @formMethod({ general: "Failed to update kit" })
  async updateKit(request: Request) {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Multiple field validation errors
    const errors: Record<string, string> = {};
    if (!name) errors.name = "Name is required";
    if (name && name.length < 3) errors.name = "Name too short";
    if (description && description.length > 500) errors.description = "Description too long";

    if (Object.keys(errors).length > 0) {
      this.throw(errors);
    }

    // Rate limiting
    await this.rateLimit(request);

    // Business logic
    await this.exDbOperation(() =>
      this.db.op.updateTable("kits").set({ name, description }).execute()
    );

    return this.formSuccess({ updated: true });
  }
}
```

## Route Dispatch Errors

In multi-intent actions, use `route.formError()` for dispatch errors (no decorator context):

```typescript
export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);

  // No decorator here - use route.formError()
  if (!result) {
    return data(route.formError({ general: "Invalid action" }));
  }

  switch (result.type) {
    case "delete": {
      const res = await route.deleteKit(request);
      return data(res);
    }
    default:
      // Unknown action type
      return data(route.formError({ general: "Unknown action type" }));
  }
}
```

---

# Rate Limiting

## Pattern

Always use `this.rateLimit(request)` inside `@formMethod`:

```typescript
@formMethod({ general: "Failed to create kit" })
async createKit(request: Request) {
  // Rate limit first (throws on limit exceeded)
  await this.rateLimit(request);

  // Then business logic
  const result = await this.exDbOperation(() =>
    this.db.op.insertInto("kits").values({ ... }).executeTakeFirst()
  );

  return this.formSuccess({ kitId: result.id });
}
```

## Migration

```typescript
// OLD: Manual rateLimitForm check
const rate = await context.services.base.rateLimitForm(request);
if (!rate.isSuccess) return rate.getError();
const res = await context.services.kit.createKit(request);

// NEW: this.rateLimit() inside @formMethod (throws on limit)
@formMethod({ general: "Failed to create kit" })
async createKit(request: Request) {
  await this.rateLimit(request);
  return await this.kit.createKit(request);
}
```

---

# File Splitting (MANDATORY for ALL RouteService)

**ALL RouteService classes must be split into `.server.tsx` files**, regardless of length:

```
app/routes/main/kit/create/
├── create.tsx           # Client component + re-exports
└── create.server.tsx    # RouteService + loader + action
```

## Server File (`create.server.tsx`)

```typescript
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { data } from "react-router";

import type { Route } from "./+types/create";

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

## Client File (`create.tsx`)

```typescript
import { useLoaderData } from "react-router";

// ... client imports only (NO server imports!)

// Re-export for React Router route discovery
export { loader, action } from "./create.server";

export default function CreateKit() {
  const loaderData = useLoaderData<typeof loader>();
  // ...
}
```

## Split File Rules (MANDATORY)

- **ALL routes with RouteService MUST use `.server.tsx` suffix** (React Router convention)
- Client file re-exports `loader`/`action` from `.server.tsx`
- `useLoaderData<typeof loader>()` works with re-exported loader
- RouteService, loader, and action stay in server file
- **Client file has NO server imports** (no `$/lib/decorators`)
- **No exceptions** — even short RouteService classes go in `.server.tsx`

---

# Checklist

- [ ] RouteService class created extending `BaseService`
- [ ] `@dataMethod()` for loader methods
- [ ] `@formMethod({ general: "..." })` for action methods
- [ ] `createRouteService(RouteService, context)` used in loader/action
- [ ] Old inline logic removed
- [ ] `context.services.base.formError()` → `route.formError()`
- [ ] `rateLimitForm()` + `isSuccess` check → `this.rateLimit()` in `@formMethod`
- [ ] Error handling with `this.throw()` in decorators
- [ ] **MANDATORY**: Split into `.server.tsx` + re-exports (all RouteService)
- [ ] Client component has no server imports
- [ ] Main route file: `export { loader, action } from "./route.server"`
