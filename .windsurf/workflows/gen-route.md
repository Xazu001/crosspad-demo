---
description: Generate a new route with loader/action following project patterns
auto_execution_mode: 3
---

# Generate Route

Create a new route file with proper structure.

## 1. Determine Route Location

| Route Type   | Location              | Description                |
| ------------ | --------------------- | -------------------------- |
| Auth         | `app/routes/auth/`    | Login, register, logout    |
| Legal/Public | `app/routes/legal/`   | Landing, blog, legal pages |
| Main/App     | `app/routes/main/`    | Authenticated app routes   |
| Profile      | `app/routes/profile/` | User profile, settings     |

## 2. Add Route Config

Add to `app/routes.ts` using `route()` or `index()`:

```tsx
import { index, layout, route } from "@react-router/dev/routes";

layout("routes/main/layout.tsx", [
  index("routes/main/home.tsx"),
  route("settings", "routes/profile/settings.tsx"),
]);
```

## 3. Create Route File

### Single File (Short RouteService <100 lines)

```tsx
// app/routes/profile/settings.tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { data } from "react-router";
import { redirect } from "react-router";

import type { Route } from "./+types/settings";

// ──────────────────────────────────────────────────────────────
// RouteService (server-side logic)
// Lives in app/routes/ but uses server-side patterns from server.md
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getData(request: Request) {
    // Auth check
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    // DB query via exDbOperation
    const settings = await this.exDbOperation(() =>
      this.db.op.selectFrom("settings").where("user_id", "=", user.user_id).executeTakeFirst()
    );

    return this.ok({ user, settings });
  }

  @formMethod({ general: "Failed to update settings" })
  async updateSettings(request: Request) {
    const formData = await request.formData();
    const theme = formData.get("theme") as string;

    // Validation
    if (!theme || !["light", "dark"].includes(theme)) {
      this.throw({ theme: "Invalid theme" });
    }

    // Rate limiting
    await this.rateLimit(request);

    // Update
    await this.exDbOperation(() =>
      this.db.op.updateTable("settings").set({ theme }).execute()
    );

    return this.formSuccess({ updated: true });
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
  const result = await route.updateSettings(request);
  return data(result);
}

// ──────────────────────────────────────────────────────────────
// Component (client-side)
// ──────────────────────────────────────────────────────────────

export default function Settings({ loaderData }: Route.ComponentProps) {
  const { user, settings } = loaderData;
  return <div>{/* content */}</div>;
}
```

### Split Files (MANDATORY for ALL RouteService)

**ALL routes with RouteService must be split into two files:**

```
app/routes/main/kit/edit/
├── edit.tsx           # Client component + re-exports
└── edit.server.tsx    # RouteService + loader + action
```

**`edit.server.tsx`** — Server-only:

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

**`edit.tsx`** — Client component with re-exports:

```tsx
import { useLoaderData } from "react-router";

// ... client imports only (no server imports!)

// Re-export for React Router route discovery
export { loader, action } from "./edit.server";

export default function EditKit() {
  const loaderData = useLoaderData<typeof loader>();
  // ...
}
```

## 4. RouteService Key Points

**RouteService lives in `app/routes/` but:**

- Extends `BaseService` from `$services/base`
- Uses decorators from `$/lib/decorators`
- Follows all server-side patterns from `server.md`

**Available in RouteService:**

| Property         | Purpose                     |
| ---------------- | --------------------------- |
| `this.auth`      | AuthService (JWT, sessions) |
| `this.user`      | UserService (profile, TOTP) |
| `this.kit`       | KitService (CRUD, R2)       |
| `this.db.op`     | Kysely query builder        |
| `this.db.cf`     | Raw D1 database             |
| `this.cache`     | CacheManager (KV)           |
| `this.responses` | HTTP response constructors  |

## 5. Create Co-located Styles

```scss
// app/routes/profile/settings.style.scss
@use "@abstracts" as *;

.settings {
  // BEM naming, use design tokens
}
```

## 6. Checklist

- [ ] Route added to `routes.ts`
- [ ] RouteService extends `BaseService`
- [ ] Loader uses `@dataMethod()` + `this.ok()`/`this.none()`
- [ ] Action uses `@formMethod()` + `this.formSuccess()`/`this.throw()`
- [ ] Loader wraps result with `data()`
- [ ] Auth check: `this.auth.getUserFromRequest(request)` → `throw redirect("/login")`
- [ ] Rate limiting: `this.rateLimit(request)` in `@formMethod`
- [ ] **MANDATORY**: Split into `.server.tsx` + re-exports (all RouteService)
- [ ] Client component has no server imports (no `$/lib/decorators`)
- [ ] Main route file: `export { loader, action } from "./route.server"`
