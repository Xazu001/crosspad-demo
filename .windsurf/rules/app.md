---
trigger: model_decision
description: When working with app code. Covers BOTH client-side (components, hooks, stores) AND server-side features (loaders, actions, RouteService).
---

# App Development Standards

## Scope: Hybrid Client + Server

The `app/` directory is **hybrid** — it contains both:

- **Client-side code** — Components, hooks, stores, utilities (runs in browser)
- **Server-side code** — Loaders, actions, RouteService (runs on server only)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APP DIRECTORY BREAKDOWN                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CLIENT-SIDE (browser)                    SERVER-SIDE (request-time)            │
│  ─────────────────────                    ──────────────────────────            │
│                                                                                 │
│  components/                              routes/*.tsx                           │
│  ├── ui/                                  ├── loader() function                  │
│  ├── custom/                              ├── action() function                  │
│  └── pages/                               └── RouteService class                 │
│                                                                                 │
│  lib/                                     routes/*.server.tsx                    │
│  ├── hooks/                               ├── RouteService (split file)          │
│  ├── stores/                              ├── loader export                      │
│  ├── contexts/                            └── action export                      │
│  ├── router/                                                                    │
│  ├── seo/                                                                       │
│  ├── shader/                                                                    │
│  └── utils/                                                                     │
│                                                                                 │
│  style/                                   entry.server.tsx                       │
│  └── Global SCSS                          └── SSR, streaming, bot detection      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** RouteService lives in `app/routes/` but uses server-side patterns from `server.md` (decorators, BaseService, response systems).

---

# Client-Side Features

## Directory Structure

```
app/
├── components/
│   ├── ui/          # Generic reusable primitives (Button, Input, Modal, Icon)
│   ├── custom/      # Business-specific components (KitCard, Navigation)
│   ├── pages/       # Page-specific component groups (home/, legal/)
│   ├── utils/       # Component utilities (cn, variants, responsive-size, modifiers)
│   ├── index.ts     # Barrel export (uiTypes)
│   └── uiTypes.ts   # Shared UI type definitions
├── lib/
│   ├── contexts/    # React contexts
│   ├── hooks/       # Custom hooks (usePadController, useIsMobile, etc.)
│   ├── menu/        # Menu configuration and utilities
│   ├── music/       # Audio/music engine
│   ├── router/      # Router helpers (useSubmitForm)
│   ├── seo/         # SEO utilities (createMeta, robots, structured-data)
│   ├── shader/      # WebGL shader infrastructure (ShaderCanvas, extendMaterial)
│   ├── stores/      # Zustand stores (createKit, editKit, playKit)
│   ├── utils/       # General utilities (getAvatarUrl, audio/image optimization)
│   └── index.ts     # Barrel export for all lib submodules
├── style/           # Global SCSS (abstracts, base, components)
├── entry.client.tsx # Client entry
└── root.tsx         # Root layout
```

## Components

See `components.md` for full component standards.

### Component Categories

| Category   | Location                 | Purpose                              |
| ---------- | ------------------------ | ------------------------------------ |
| **UI**     | `app/components/ui/`     | Generic reusable primitives          |
| **Custom** | `app/components/custom/` | Business-specific components         |
| **Pages**  | `app/components/pages/`  | Page-specific groups (`pages/home/`) |

### Client-Only Components

- Suffix: `.client.tsx` for browser-only components
- Wrap: `<ClientOnly fallback={...}>` from `#/components/custom/client-only`
- When: browser APIs, WebGL/Three.js, audio, localStorage

## Hooks & State

### Custom Hooks (`app/lib/hooks/`)

- Domain-specific logic: `usePadController`, `useMetronome`, `useRecordingLogic`
- UI helpers: `useIsMobile`, `useDropdownKeyNav`, `usePanelSystem`
- Extract complex state logic from components into hooks

### Zustand Stores (`app/lib/stores/`)

- `createKit.ts` — Kit creation wizard state
- `editKit.ts` — Kit editing state
- `playKit.ts` — Kit player state (audio, pads, recording)

### Router Helpers (`app/lib/router/`)

**`useSubmitForm`** — Unified hook for form submissions with React Router fetcher:

```tsx
const { submit, isSubmitting, errors } = useSubmitForm<LoginResult>({
  action: "/login",
  onSuccess: (result) => navigate("/"),
});
```

**Multiple forms in one route:** Each form needs its own fetcher:

```tsx
// CORRECT: Separate fetchers
const deleteFetcher = useFetcher();
const settingsFetcher = useFetcher();

const { submit: submitDelete } = useSubmitForm({ fetcher: deleteFetcher });
const { submit: submitSettings } = useSubmitForm({ fetcher: settingsFetcher });
```

## Utilities

| Utility                | Location                | Purpose              |
| ---------------------- | ----------------------- | -------------------- |
| `createMeta`           | `app/lib/seo/`          | Meta tags            |
| `cn`, `createVariants` | `app/components/utils/` | Component utilities  |
| `useSubmitForm`        | `app/lib/router/`       | Form submission hook |
| `createTypedSubmit`    | `shared/utils/`         | Multi-action forms   |

## Navigation

**Always use `useLocation()` instead of `window.location.pathname`** — works with SSR.

---

# Server-Side Features (in App)

## Route Structure

```
app/routes/
├── auth/              # Login, register, logout
│   ├── login.tsx
│   └── register.tsx
├── legal/             # Landing, blog, legal pages
│   ├── index.tsx
│   ├── layout.tsx
│   └── privacy.tsx
├── main/              # Main app (authenticated)
│   ├── home.tsx
│   ├── layout.tsx
│   └── kit/
│       ├── edit.tsx
│       ├── edit.server.tsx    # Split RouteService file
│       └── play.tsx
└── profile/           # User profile, settings
    ├── settings.tsx
    └── settings.server.tsx
```

### Route File Types

| File                    | Purpose                              | Runs where  |
| ----------------------- | ------------------------------------ | ----------- |
| `index.tsx`             | Main page component                  | Client      |
| `layout.tsx`            | Layout wrapper + loader/action       | Both        |
| `route-name.tsx`        | Specific route page                  | Client      |
| `route-name.server.tsx` | RouteService + loader/action exports | Server only |
| `$.tsx`                 | 404 catch-all                        | Client      |

### Route Config (`routes.ts`)

Routes use `layout()`, `route()`, `index()` from `@react-router/dev/routes`:

```tsx
layout("routes/main/layout.tsx", [
  index("routes/main/home.tsx"),
  route("kit/edit", "routes/main/kit/edit.tsx"),
]);
```

---

# RouteService Pattern

**All loaders and actions** should use `createRouteService(RouteService, context)` to access server-side features.

## Why RouteService?

RouteService provides:

- **Database access** — `this.db.op/cf/dr`
- **Cross-service calls** — `this.auth`, `this.kit`, `this.user`
- **Decorators** — `@dataMethod`, `@formMethod` for error handling
- **Response helpers** — `this.ok()`, `this.formSuccess()`, `this.throw()`
- **Rate limiting** — `this.rateLimit(request)`
- **Cache/Queue** — `this.cache`, `this.queue`

## Basic RouteService

```tsx
// app/routes/profile/settings.tsx
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { data } from "react-router";

import type { Route } from "./+types/settings";

// ──────────────────────────────────────────────────────────────
// RouteService (server-side logic)
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getSettingsData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    const preferences = await this.exDbOperation(() =>
      this.db.op.selectFrom("preferences").where("user_id", "=", user.user_id).executeTakeFirst()
    );

    return this.ok({ user, preferences });
  }

  @formMethod({ general: "Failed to update settings" })
  async updateSettings(request: Request) {
    const formData = await request.formData();
    const theme = formData.get("theme") as string;

    if (!theme || !["light", "dark", "system"].includes(theme)) {
      this.throw({ theme: "Invalid theme selection" });
    }

    await this.rateLimit(request);

    await this.exDbOperation(() =>
      this.db.op.updateTable("preferences").set({ theme }).execute()
    );

    return this.formSuccess({ updated: true });
  }
}

// ──────────────────────────────────────────────────────────────
// Loader & Action
// ──────────────────────────────────────────────────────────────

export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getSettingsData(request);
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
  const { user, preferences } = loaderData;
  // ... component implementation
}
```

## Split RouteService File (MANDATORY)

**ALL RouteService classes must be split into `.server.tsx` files**, regardless of length:

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

// ... client imports only

// Re-export for React Router route discovery
export { loader, action } from "./edit.server";

export default function EditKit() {
  const loaderData = useLoaderData<typeof loader>();
  // ...
}
```

**Split file rules (MANDATORY):**

- **ALL routes with RouteService MUST use `.server.tsx` suffix** (React Router convention)
- Client file re-exports `loader`/`action` from `.server.tsx`
- `useLoaderData<typeof loader>()` works with re-exported loader
- Only UI components and hooks in client file
- RouteService, loader, and action stay in server file
- **No exceptions** — even short RouteService classes go in `.server.tsx`

---

# Loaders

## Loader Pattern

```tsx
export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getData(request);
  return data(result);
}
```

## RouteService Loader Methods

Use `@dataMethod()` for loader methods:

```tsx
class RouteService extends BaseService {
  @dataMethod()
  async getData(request: Request) {
    // Get user (or redirect)
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    // Fetch data
    const kits = await this.exDbOperation(() =>
      this.db.op.selectFrom("kits").where("user_id", "=", user.user_id).execute()
    );

    // Return data
    return this.ok({ user, kits });
  }
}
```

## Loader Return Values

| Return                 | Meaning           | Component receives |
| ---------------------- | ----------------- | ------------------ |
| `this.ok(data)`        | Success with data | `data`             |
| `this.none()`          | Success with null | `null`             |
| `this.throw(Response)` | HTTP error        | Error page         |
| `throw redirect()`     | Redirect          | Redirects          |

## Consuming Loader Data

```tsx
export default function MyRoute({ loaderData }: Route.ComponentProps) {
  const { user, kits } = loaderData;
  // or: const loaderData = useLoaderData<typeof loader>();
}
```

---

# Actions

## Action Pattern

```tsx
export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.doAction(request);
  return data(result);
}
```

## RouteService Action Methods

Use `@formMethod()` for action methods:

```tsx
class RouteService extends BaseService {
  @formMethod({ general: "Operation failed" })
  async doAction(request: Request) {
    const formData = await request.formData();

    // Validation
    const name = formData.get("name") as string;
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

## Action Return Values

| Return                   | Meaning             | Component receives    |
| ------------------------ | ------------------- | --------------------- |
| `this.formSuccess(data)` | Success with result | `FormResponseSuccess` |
| `this.throw({ fields })` | Validation error    | `FormResponseError`   |
| `this.throw(Response)`   | HTTP error          | Error page            |

## Consuming Action Data

```tsx
const actionData = useActionData<typeof action>();

if (actionData?.success) {
  // Success: actionData.data contains result
} else {
  // Error: actionData?.errors contains field errors
}
```

---

# Multi-Intent Actions (Typed Submit)

For routes with multiple form handlers, use typed submit pattern.

## Component Side

```tsx
import { createTypedSubmit } from "@/utils";

// Submit with type identifier
submit(createTypedSubmit("delete-kit"), { method: "POST" });
submit(createTypedSubmit("update-settings", { theme: "dark" }), {
  method: "POST",
});
```

## Action Dispatch

```tsx
import { parseTypedSubmit } from "@/utils";

export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);

  // Parse typed submit
  const result = await parseTypedSubmit(request);
  if (!result) return data(route.formError({ general: "Invalid action" }));

  // Dispatch by type
  switch (result.type) {
    case "delete-kit": {
      const res = await route.deleteKit(request);
      return data(res);
    }
    case "update-settings": {
      const res = await route.updateSettings(request);
      return data(res);
    }
    default:
      return data(route.formError({ general: "Unknown action" }));
  }
}
```

**Key points:**

- Dispatch stays in route action (not RouteService)
- Use `route.formError()` for inline errors (no decorator context)
- Each case calls a decorated RouteService method

See `typed-submit.md` for full details.

---

# Server-Side Rules Summary

For detailed server-side patterns (decorators, response systems, error handling), see `server.md`.

## Quick Reference

| What                 | Use                              | Decorator        |
| -------------------- | -------------------------------- | ---------------- |
| Loader data method   | `this.ok(data)` / `this.none()`  | `@dataMethod()`  |
| Action method        | `this.formSuccess(data)`         | `@formMethod()`  |
| Validation error     | `this.throw({ field: "msg" })`   | In decorators    |
| HTTP error           | `this.throw(this.responses.*())` | In decorators    |
| Redirect             | `throw redirect("/path")`        | In decorators    |
| Rate limiting        | `await this.rateLimit(request)`  | In `@formMethod` |
| Route dispatch error | `route.formError({ general })`   | No decorator     |
