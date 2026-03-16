---
description: Refactor current file or all open files according to project rules
auto_execution_mode: 3
---

# Refactor Module

Refactor file(s) to comply with `.windsurf/rules/`.

## 1. Identify File Type & Scope

| File Location                | Type               | Scope           | Rules to read                              |
| ---------------------------- | ------------------ | --------------- | ------------------------------------------ |
| `server/**/*.ts`             | Pure server        | Server only     | `server.md`, `aliases.md`                  |
| `app/routes/**/*.tsx`        | Route (hybrid)     | Client + Server | `app.md`, `server.md`, `aliases.md`        |
| `app/routes/**/*.server.tsx` | RouteService only  | Server only     | `app.md`, `server.md`, `aliases.md`        |
| `app/components/**/*.tsx`    | Component (client) | Client only     | `components.md`, `tokens.md`, `aliases.md` |
| `app/lib/**/*.ts`            | Utility/Hook/Store | Client only     | `app.md`, `aliases.md`                     |
| `shared/**/*.ts`             | Shared             | Both            | `core.md`, `aliases.md`                    |
| `**/*.scss`                  | Styles             | —               | `styling.md`, `tokens.md`                  |

## 2. Check by File Type

### Server Files (`server/`)

- **Imports**: Only `$/` and `@/` — **NEVER** `#/` (app)
- **Services**: Extend `BaseService`, use decorators
- **Decorators**: `@dataMethod()` for data, `@formMethod()` for forms
- **Returns**: `this.ok()`/`this.none()` for data, `this.formSuccess()`/`this.throw()` for forms
- **Database**: `this.exDbOperation()` for single, `this.exDbBatchOperation()` for batch
- **API endpoints**: Use `apiSuccess()`/`apiError()` from `$/lib/response`
- **Queue handlers**: Use `queueOk()`/`queueFailed()` from `$/cloudflare`

### Route Files (`app/routes/`)

Routes are **hybrid** — check both client and server parts:

**Server-side (RouteService, loader, action):**

- **Imports**: `$/lib/decorators`, `$/services/base`, `react-router`
- **RouteService**: Extends `BaseService`, uses decorators from `$/lib/decorators`
- **Loader**: `@dataMethod()` → `this.ok(data)` → wrap with `data()`
- **Action**: `@formMethod()` → `this.formSuccess()` or `this.throw({ fields })`
- **Multi-intent dispatch**: Use `route.formError({ general })` (no decorator context)
- **Rate limiting**: `this.rateLimit(request)` inside `@formMethod`
- **Auth check**: `this.auth.getUserFromRequest(request)` → `throw redirect("/login")` if null

**Client-side (component):**

- **Imports**: Only `#/` and `@/` — no server imports (no `$/lib/decorators`)
- **Hooks**: `useLoaderData<typeof loader>()`, `useActionData<typeof action>()`
- **Forms**: Use `useSubmitForm` from `#/lib/router`

### Split Route Files

If route has both `route.tsx` and `route.server.tsx`:

- **`route.server.tsx`**: RouteService, loader, action exports — server imports OK
- **`route.tsx`**: Component only, re-exports from `.server` — **NO** server imports

### Component Files (`app/components/`)

- **Imports**: Only `#/` and `@/` — **NO** `$/` (server)
- **Naming**: `kebab-case.tsx`, PascalCase component name
- **Variants**: Use `createVariants()` from `#/lib/utils/component-utils`
- **Props**: Use `forwardRef`, extend HTML attributes
- **Client-only**: `.client.tsx` suffix, wrap with `<ClientOnly>`
- **SCSS**: Co-located, BEM naming, use design tokens

### Style Files (`**/*.scss`)

- **Imports**: `@use "@abstracts" as *;`
- **Naming**: BEM (`.block__element--modifier`)
- **Tokens**: Use `$color-primary`, `$text-md`, etc. — no magic values
- **Units**: Use `rem` for spacing/sizing
- **Colors**: Use OKLCH tokens, `color.change()` for variations

## 3. Common Fixes

### Response System Fixes

| Wrong                            | Right                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| `return data({ success: true })` | `return this.formSuccess({ ... })`                          |
| `return data({ errors: {...} })` | `this.throw({ field: "msg" })` in decorator                 |
| `throw new Error("msg")`         | `this.throw({ general: "msg" })` in `@formMethod`           |
| `throw new Error("msg")`         | `this.throw(this.responses.getNotFound())` in `@dataMethod` |
| `rateLimitForm()` + `isSuccess`  | `this.rateLimit(request)` in `@formMethod`                  |

### Import Fixes

| Wrong                                | Right                                           |
| ------------------------------------ | ----------------------------------------------- |
| `import { ... } from "../server/"`   | `import { ... } from "$/"`                      |
| `import { ... } from "../app/"`      | `import { ... } from "#/"`                      |
| Server file imports from `#/`        | **ERROR** — server cannot import from app       |
| Component imports `$/lib/decorators` | **ERROR** — client cannot use server decorators |

### Decorator Fixes

| Wrong                                   | Right                                 |
| --------------------------------------- | ------------------------------------- |
| Loader method without decorator         | Add `@dataMethod()`                   |
| Action method without decorator         | Add `@formMethod({ general: "..." })` |
| `@dataMethod()` returning `formSuccess` | Use `this.ok(data)` instead           |
| `@formMethod()` returning `this.ok`     | Use `this.formSuccess(data)` instead  |

## 4. Apply Changes

- **Minimal changes** — only fix violations, preserve functionality
- **Preserve comments** — don't remove existing comments
- **Keep structure** — don't reorganize unless necessary for compliance
