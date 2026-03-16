---
trigger: model_decision
description: When working with server-side code. Covers structure, services, database, auth, decorators, response systems, and security.
---

# Server Standards

## Scope: Pure Server-Side

The `server/` directory contains **only server-side code** that never ships to the browser:

- **Services** — Business logic (AuthService, KitService, UserService)
- **API Endpoints** — Hono REST routes
- **Database Layer** — Drizzle/Kysely/D1
- **Cloudflare Workers** — Crons, queues, KV
- **Decorators** — Service method wrappers
- **Response Systems** — Form, API, HTTP, Queue responses

**RouteService** (in `app/routes/`) also uses server-side patterns but lives in `app/` for React Router integration. See `app.md` for RouteService patterns.

## Structure

```
server/
├── index.ts                    # Entry point
├── setup.ts                    # Hono app creation, DB + service wiring
├── load-context.ts             # React Router context (AppLoadContext)
│
├── core/                       # Core server infrastructure
│   ├── index.ts                # Barrel export
│   └── types.ts                # Services interface, Database type
│
├── api/                        # Hono API routes
│   ├── index.ts                # Main API router
│   ├── admin/
│   │   ├── index.ts
│   │   └── cli.ts              # Flattened CLI handlers
│   ├── auth/
│   ├── priv/
│   ├── dev.ts
│   └── mail-previews-hmr.ts
│
├── database/                   # Database layer
│   ├── index.ts                # Barrel export
│   ├── schema.ts               # Drizzle schema definitions
│   └── tables.ts               # Kysely table types (Kyselify)
│
├── services/                   # Business logic
│   ├── index.ts                # Barrel export
│   ├── base.ts                 # BaseService class
│   ├── auth.ts                 # AuthService (JWT, sessions)
│   ├── user/                   # UserService (registration, profile, TOTP)
│   │   └── index.ts
│   ├── kit/                    # KitService (kit CRUD, R2 files)
│   │   ├── index.ts
│   │   └── types.ts
│   └── admin/                  # AdminService
│       └── index.ts
│
├── middleware/                 # Route middleware
│   ├── index.ts                # Barrel export
│   ├── admin.ts
│   └── priv.ts
│
├── cloudflare/                 # CF-specific (crons, KV, queues)
│   ├── index.ts
│   ├── kv/
│   ├── queue/
│   │   ├── index.ts
│   │   ├── result.ts           # QueueResult types
│   │   └── handlers/
│   └── crons/
│
└── lib/                        # Shared utilities
    ├── index.ts                # Barrel export
    ├── response/               # Response systems (form, api, http, messages)
    │   ├── index.ts
    │   ├── form.ts
    │   ├── api.ts
    │   ├── http.ts
    │   └── messages.ts
    ├── cookies/                # Cookie definitions and helpers
    │   ├── index.ts
    │   ├── cookies.ts
    │   └── helpers.ts
    ├── crypto/                 # Password hashing (PBKDF2)
    │   ├── index.ts
    │   └── password.ts
    ├── mail/                   # Mail provider and templates
    │   ├── index.ts
    │   ├── provider.ts
    │   └── templates/
    ├── decorators/             # Service method decorators
    │   ├── index.ts
    │   ├── form-method.ts
    │   ├── data-method.ts
    │   └── route-service.ts
    ├── validation/             # Zod validation schemas
    └── utils/                  # General utilities (files, image)
        ├── index.ts
        ├── files.ts
        └── image-processing.ts
```

## Key Files

| File              | Purpose                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `setup.ts`        | Creates Hono app, wires Kysely/Drizzle/D1, JWT keypair, services middleware     |
| `load-context.ts` | Augments `AppLoadContext` with `cloudflare.{env, ctx, ASSETS}` and `services`   |
| `core/types.ts`   | `Services` interface (auth, user, kit, preferences), `Database` type (op/cf/dr) |

---

# Service Method Decorators

All service methods (both `server/services/` and RouteService in `app/routes/`) **must use decorators** from `$/lib/decorators`.

## Decorator Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DECORATOR DECISION TREE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Is this method called from a route?                                            │
│      │                                                                          │
│      ├─ YES ── What type of route?                                              │
│      │           │                                                              │
│      │           ├─ LOADER (GET data) ──────────► @dataMethod()                 │
│      │           │                               or @loaderMethod()             │
│      │           │                               Return: this.ok(data)          │
│      │           │                                      or this.none()         │
│      │           │                                      or this.throw(...)    │
│      │           │                                                              │
│      │           └─ ACTION (POST/PUT/DELETE) ──► @formMethod({ general })      │
│      │                                            Return: this.formSuccess()   │
│      │                                                   or this.throw(...)    │
│      │                                                                          │
│      └─ NO ── Is it a helper called by another decorated method?                │
│                    │                                                            │
│                    ├─ YES ──► NO DECORATOR (errors propagate to caller)         │
│                    │                                                            │
│                    └─ NO ──► @dataMethod() (universal, can be called anywhere)  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Decorator Reference

### `@dataMethod()` — Universal Data Fetching

**Use for:** Loaders, universal data methods, any method that returns data (not form results).

```typescript
@dataMethod()
async getById(id: string) {
  const kit = await this.exDbOperation(() =>
    this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
  );

  // Not found → throw HTTP response
  if (!kit) this.throw(this.responses.getNotFound("Kit not found"));

  // Success → return data
  return this.ok(kit);
}

@dataMethod()
async getOptionalData(userId: string) {
  const prefs = await this.exDbOperation(() =>
    this.db.op.selectFrom("preferences").where("user_id", "=", userId).executeTakeFirst()
  );

  // No data is valid → return null (not an error)
  if (!prefs) return this.none();

  return this.ok(prefs);
}
```

**Error handling:**

| What you throw                   | What happens                              |
| -------------------------------- | ----------------------------------------- |
| `this.throw(Response)`           | Decorator re-throws the Response          |
| `this.throw({ general/fields })` | Decorator converts to 400 Response        |
| `throw redirect("/path")`        | Decorator re-throws (works for redirects) |
| Any other throw                  | Decorator converts to 500 Response        |

**Return values:**

| Return            | Meaning                            | Loader receives |
| ----------------- | ---------------------------------- | --------------- |
| `this.ok(data)`   | Success with data                  | `data`          |
| `this.none()`     | Success with no data (null)        | `null`          |
| `this.throw(...)` | Error (flow breaks, never returns) | —               |

---

### `@loaderMethod()` — Loader-Only

**Use for:** Methods that should **only** be called from loaders. Same behavior as `@dataMethod()` but signals intent.

```typescript
@loaderMethod()
async getPrivateData(request: Request) {
  const user = await this.auth.getUserFromRequest(request);
  if (!user) throw redirect("/login"); // Idiomatic for redirects

  const data = await this.exDbOperation(() =>
    this.db.op.selectFrom("secrets").where("user_id", "=", user.user_id).execute()
  );

  return this.ok(data);
}
```

**When to use `@loaderMethod` vs `@dataMethod`:**

| Use `@loaderMethod` when             | Use `@dataMethod` when              |
| ------------------------------------ | ----------------------------------- |
| Method is loader-specific            | Method might be called from actions |
| You want to signal "GET only" intent | Method is universal/reusable        |
| Never called from form submissions   | Could be called anywhere            |

---

### `@formMethod()` — Form Actions

**Use for:** All form submission handlers (POST/PUT/DELETE actions).

```typescript
@formMethod({ general: "Failed to create kit" })
async createKit(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name") as string;

  // Validation error → throw form errors
  if (!name || name.length < 3) {
    this.throw({
      name: "Name must be at least 3 characters",
      general: "Please fix the errors above"
    });
  }

  // Rate limiting (throws on limit exceeded)
  await this.rateLimit(request);

  // Business logic
  const kit = await this.exDbOperation(() =>
    this.db.op.insertInto("kits").values({ name, user_id: this.user.user_id }).executeTakeFirst()
  );

  // Success → return form success
  return this.formSuccess({ kitId: kit.id });
}
```

**Error handling:**

| What you throw                   | What happens                                               |
| -------------------------------- | ---------------------------------------------------------- |
| `this.throw({ general: "..." })` | Decorator returns `formError({ general: "..." })`          |
| `this.throw({ field: "..." })`   | Decorator returns `formError({ field: "..." })`            |
| `this.throw(Response)`           | Decorator extracts message, returns formError              |
| Any other throw                  | Decorator returns `formError({ general: defaultMessage })` |

**Return values:**

| Return                   | Meaning               | Action receives       |
| ------------------------ | --------------------- | --------------------- |
| `this.formSuccess(data)` | Success with result   | `FormResponseSuccess` |
| `this.throw(...)`        | Error (never returns) | `FormResponseError`   |

**Default message:** The `{ general: "..." }` argument is the fallback error message when no specific error is thrown.

---

## Decorator Comparison Table

| Feature               | `@dataMethod()`        | `@loaderMethod()`      | `@formMethod()`              |
| --------------------- | ---------------------- | ---------------------- | ---------------------------- |
| **Use case**          | Loaders, universal     | Loaders only           | Actions, form submissions    |
| **Success return**    | `this.ok(data)`        | `this.ok(data)`        | `this.formSuccess(data)`     |
| **No data return**    | `this.none()`          | `this.none()`          | N/A (use `this.throw`)       |
| **Error throw**       | `this.throw(Response)` | `this.throw(Response)` | `this.throw({ fields })`     |
| **Validation errors** | → 400 Response         | → 400 Response         | → `FormResponseError`        |
| **HTTP errors**       | Re-thrown              | Re-thrown              | Extracted to form error      |
| **Unknown errors**    | → 500 Response         | → 500 Response         | → Default message            |
| **Redirects**         | `throw redirect()`     | `throw redirect()`     | Use `this.throw(redirect())` |

---

## `this.throw()` — Universal Error Throwing

**`this.throw()` works in ALL decorated methods** and is the preferred way to handle errors.

### Signature

```typescript
// Form errors (for @formMethod)
this.throw({ general: "Something went wrong" });
this.throw({
  email: "Invalid email",
  password: "Too short",
  general: "Validation failed",
});

// HTTP responses (for @dataMethod/@loaderMethod)
this.throw(this.responses.getNotFound("Kit not found"));
this.throw(this.responses.getUnauthorized());
this.throw(this.responses.getBadRequest("Invalid request"));

// Redirects (idiomatic shortcut)
throw redirect("/login"); // Preferred for redirects
this.throw(redirect("/login")); // Also works
```

### Error Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ERROR FLOW IN DECORATORS                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  @formMethod                                                                    │
│  ──────────                                                                     │
│  this.throw({ general: "msg" })                                                 │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Returns FormResponseError({ general: "msg" })                   │
│                                                                                 │
│  this.throw(Response)                                                           │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Extracts message from Response                                  │
│                 └──► Returns FormResponseError({ general: extractedMsg })       │
│                                                                                 │
│  throw new Error("unexpected")                                                  │
│       │                                                                         │
│       └──► Decorator catches                                                   │
│            └──► Returns FormResponseError({ general: defaultMessage })          │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  @dataMethod / @loaderMethod                                                    │
│  ───────────────────────────                                                    │
│  this.throw(Response)                                                           │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Re-throws Response (client receives HTTP error)                 │
│                                                                                 │
│  this.throw({ general: "msg" })                                                 │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Converts to 400 Response with JSON body                         │
│                 └──► Re-throws Response                                         │
│                                                                                 │
│  throw redirect("/path")                                                        │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Re-throws redirect (client redirects)                           │
│                                                                                 │
│  throw new Error("unexpected")                                                  │
│       │                                                                         │
│       └──► Decorator catches                                                    │
│            └──► Converts to 500 Response                                        │
│                 └──► Re-throws Response                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# BaseService Methods

All services (and RouteService) extend `BaseService` which provides:

## Response Methods

| Method                   | Use in         | Purpose                                  |
| ------------------------ | -------------- | ---------------------------------------- |
| `this.ok(data)`          | @dataMethod    | Return successful data                   |
| `this.none()`            | @dataMethod    | Return null (valid "no data" state)      |
| `this.formSuccess(data)` | @formMethod    | Return successful form result            |
| `this.formError(errors)` | Route dispatch | Return form error (no decorator context) |
| `this.throw(input)`      | All decorators | Universal error throwing                 |

## Database Methods

| Method                        | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `this.exDbOperation(fn)`      | Single DB query with error handling     |
| `this.exDbBatchOperation(fn)` | Batch D1 statements with error handling |

**NEVER nest `exDbOperation` inside `exDbBatchOperation`** — each has its own error handling.

## Service Access

| Property             | Purpose                           |
| -------------------- | --------------------------------- |
| `this.services.auth` | AuthService (JWT, sessions)       |
| `this.services.user` | UserService (profile, TOTP)       |
| `this.services.kit`  | KitService (CRUD, R2)             |
| `this.auth`          | Shortcut for `this.services.auth` |
| `this.user`          | Shortcut for `this.services.user` |
| `this.kit`           | Shortcut for `this.services.kit`  |

## Infrastructure

| Property               | Purpose                          |
| ---------------------- | -------------------------------- |
| `this.db.op`           | Kysely query builder             |
| `this.db.cf`           | Raw D1 database                  |
| `this.db.dr`           | Drizzle ORM                      |
| `this.cache`           | CacheManager (KV)                |
| `this.queue`           | QueueManager (Cloudflare Queues) |
| `this.responses`       | HTTP response constructors       |
| `this.getMessage(key)` | Typed message catalog access     |

---

# Four Response Systems

The project has four distinct response systems. Choose based on context:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          RESPONSE SYSTEM DECISION                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Where is this code running?                                                    │
│      │                                                                          │
│      ├─ ROUTE ACTION (React Router)                                             │
│      │       │                                                                  │
│      │       └──► FormResponse                                                  │
│      │           • @formMethod → this.formSuccess() / this.throw()             │
│      │           • Route dispatch → route.formError()                           │
│      │           • Types: FormResponseResult<T>, FormResponseError              │
│      │                                                                          │
│      ├─ ROUTE LOADER (React Router)                                             │
│      │       │                                                                  │
│      │       └──► Data Response                                                 │
│      │           • @dataMethod → this.ok() / this.throw(Response)                │
│      │           • Wrap with data() in loader                                   │
│      │                                                                          │
│      ├─ REST API ENDPOINT (Hono)                                                │
│      │       │                                                                  │
│      │       └──► ApiResponse                                                   │
│      │           • apiSuccess(data) / apiError(message, status)                 │
│      │           • Types: ApiResponse<T>, ApiSuccess, ApiError                  │
│      │                                                                          │
│      └─ QUEUE HANDLER (Cloudflare Workers)                                      │
│              │                                                                  │
│              └──► QueueResult                                                   │
│                  • queueOk(data) / queueFailed(message, retry?)                 │
│                  • Types: QueueResult<T>, QueueOk, QueueFailed                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Response System Reference

### 1. FormResponse (Route Actions)

**Location:** `$/lib/response/form`
**Import:** Types via `$/lib/response`, helpers via decorator pattern

```typescript
// Types
type FormResponseResult<T> = FormResponseSuccess<T> | FormResponseError;
interface FormResponseSuccess<T> {
  success: true;
  data: T;
}
interface FormResponseError {
  success: false;
  errors: FormErrors;
}
interface FormErrors {
  general?: string;
  [field: string]: string | undefined;
}

// In @formMethod
return this.formSuccess({ userId: "123" });
this.throw({ email: "Invalid email", general: "Validation failed" });

// In route dispatch (no decorator)
return data(route.formError({ general: "Unknown action" }));
```

### 2. Data Response (Route Loaders)

**Location:** `react-router` `data()` function
**Pattern:** Service returns data, loader wraps with `data()`

```typescript
// In @dataMethod service
return this.ok({ user, kits });
return this.none(); // null

// In loader
export async function loader({ context }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getData();
  return data(result); // Wraps in React Router data response
}
```

### 3. ApiResponse (REST Endpoints)

**Location:** `$/lib/response/api`
**Import:** `import { apiSuccess, apiError } from "$/lib/response";`

```typescript
// In Hono endpoint
app.get("/users/:id", async (c) => {
  const services = c.get("services");
  const user = await services.user.getById(c.req.param("id"));

  if (!user) {
    return c.json(apiError("User not found", 404), 404);
  }

  return c.json(apiSuccess({ user }));
});

// Types
type ApiResponse<T> = ApiSuccess<T> | ApiError;
interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiError {
  success: false;
  error: { message: string; code?: number };
}
```

### 4. QueueResult (Background Workers)

**Location:** `$/cloudflare/queue/result`
**Import:** `import { queueOk, queueFailed } from "$/cloudflare";`

```typescript
// In queue handler
export const myQueueHandler: QueueHandler = {
  async handler(message, env, ctx) {
    try {
      const result = await processMessage(message);
      return queueOk({ processed: true, id: result.id });
    } catch (error) {
      return queueFailed("Processing failed", { retry: true });
    }
  },
};

// Types
type QueueResult<T> = QueueOk<T> | QueueFailed;
interface QueueOk<T> {
  ok: true;
  data: T;
}
interface QueueFailed {
  ok: false;
  error: string;
  retry?: boolean;
}
```

---

# HTTP Response Helpers

**Location:** `$/lib/response/http`
**Access:** `this.responses` in services, or `context.services.base.responses`

```typescript
// Available responses
this.responses.getNotFound(message?)      // 404
this.responses.getUnauthorized()          // 401
this.responses.getBadRequest(message?)    // 400
this.responses.getForbidden()             // 403
this.responses.getServerError(message?)   // 500
this.responses.getNoAccess()              // 403 (alias)
this.responses.json(data, status)         // Generic JSON response
```

**Usage in decorators:**

```typescript
@dataMethod()
async getKit(id: string) {
  const kit = await this.exDbOperation(() =>
    this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
  );

  if (!kit) {
    this.throw(this.responses.getNotFound("Kit not found"));
  }

  return this.ok(kit);
}
```

---

# Service Pattern Rules

## Service Structure

```typescript
// server/services/kit/index.ts
import { dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

export class KitService extends BaseService {
  // Data methods (loaders)
  @dataMethod()
  async getById(id: string) {
    const kit = await this.exDbOperation(() =>
      this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
    );
    if (!kit) this.throw(this.responses.getNotFound("Kit not found"));
    return this.ok(kit);
  }

  @dataMethod()
  async listByUser(userId: string) {
    const kits = await this.exDbOperation(() =>
      this.db.op.selectFrom("kits").where("user_id", "=", userId).execute()
    );
    return this.ok(kits);
  }

  // Form methods (actions)
  @formMethod({ general: "Failed to create kit" })
  async create(request: Request) {
    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name || name.length < 3) {
      this.throw({ name: "Name must be at least 3 characters" });
    }

    await this.rateLimit(request);

    const kit = await this.exDbOperation(() =>
      this.db.op.insertInto("kits").values({ name, user_id: this.user.user_id }).executeTakeFirst()
    );

    return this.formSuccess({ kitId: kit.id });
  }

  // Helper methods (no decorator - called by other methods)
  private validateKitName(name: string): boolean {
    return name.length >= 3 && name.length <= 100;
  }
}
```

## Cross-Service Calls

Services access each other via `this.services`:

```typescript
// In KitService
@formMethod({ general: "Failed to transfer kit" })
async transfer(request: Request, targetUserId: string) {
  // Access other services
  const targetUser = await this.services.user.getById(targetUserId);
  if (!targetUser) {
    this.throw({ general: "Target user not found" });
  }

  // Use auth service
  const currentUser = await this.auth.getUserFromRequest(request);
  if (!currentUser) {
    throw redirect("/login");
  }

  // Business logic...
  return this.formSuccess({ transferred: true });
}
```

## Service Container

Services are registered in `setup.ts` and typed in `core/types.ts`:

```typescript
// server/core/types.ts
export interface Services {
  auth: AuthService;
  user: UserService;
  kit: KitService;
  admin: AdminService;
  base: BaseService; // For responses, cache, queue access
}
```

---

# Database

- **Three query interfaces**: `db.op` (Kysely), `db.cf` (raw D1), `db.dr` (Drizzle)
- Schema in `server/database/schema.ts`, table types in `tables.ts`
- Dates stored as timestamps — convert with service helpers

## Database Operations

**Always use `exDbOperation` for single queries:**

```typescript
const result = await this.exDbOperation(() => this.db.op.selectFrom("users").selectAll().execute());
```

**Use `exDbBatchOperation` for multiple statements:**

```typescript
await this.exDbBatchOperation([
  this.db.cf.prepare("INSERT INTO users ...").bind(...),
  this.db.cf.prepare("INSERT INTO profiles ...").bind(...),
]);
```

**NEVER nest `exDbOperation` inside `exDbBatchOperation`.**

---

# Auth & Sessions

- **RS256 JWT** via `getKeyPair()` with env keys `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`
- Token creation/verification in `AuthService`
- Session cookies serialized via cookie helpers in `lib/cookies/helpers.ts`
- Always verify requests: `context.services.auth.getUserFromRequest(request)`
- JWT expiration: `4h` default, `5y` for long-lived tokens

---

# Rate Limiting

In `@formMethod`, use `this.rateLimit(request)`:

```typescript
@formMethod({ general: "Too many requests" })
async create(request: Request) {
  // Throws on rate limit exceeded
  await this.rateLimit(request);

  // Continue with action...
  return this.formSuccess({ created: true });
}
```

The decorator will catch the rate limit error and return the appropriate response.

---

# Quick Reference

## Decorator Quick Pick

| I'm writing a...                  | Use                  | Return on success    | Throw on error           |
| --------------------------------- | -------------------- | -------------------- | ------------------------ |
| Loader data method                | `@dataMethod()`      | `this.ok(data)`      | `this.throw(Response)`   |
| Loader-only data method           | `@loaderMethod()`    | `this.ok(data)`      | `this.throw(Response)`   |
| Form action method                | `@formMethod({...})` | `this.formSuccess()` | `this.throw({ fields })` |
| Helper called by decorated method | No decorator         | Regular return       | `throw` (propagates)     |

## Response Quick Pick

| Context          | Use                         | Import from              |
| ---------------- | --------------------------- | ------------------------ |
| Route action     | `this.formSuccess()`        | Decorator pattern        |
| Route loader     | `this.ok()` + `data()`      | Decorator + react-router |
| REST API         | `apiSuccess()`/`apiError()` | `$/lib/response`         |
| Queue handler    | `queueOk()`/`queueFailed()` | `$/cloudflare`           |
| HTTP error throw | `this.responses.get*()`     | `this.responses`         |

## Error Quick Pick

| Situation        | In @formMethod                     | In @dataMethod                                |
| ---------------- | ---------------------------------- | --------------------------------------------- |
| Validation error | `this.throw({ field: "..." })`     | `this.throw({ general: "..." })` → 400        |
| Not found        | `this.throw({ general: "..." })`   | `this.throw(this.responses.getNotFound())`    |
| Unauthorized     | `this.throw({ general: "..." })`   | `throw redirect("/login")`                    |
| Rate limited     | `this.rateLimit()` (throws)        | N/A                                           |
| Server error     | `this.throw({ general: default })` | `this.throw(this.responses.getServerError())` |
