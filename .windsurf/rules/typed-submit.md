---
trigger: model_decision
description: When implementing multiple submit handlers in a single route action via typed submits.
---

# Typed Submit Pattern

Multiple submit handlers in one route action, differentiated by `_type` field.

**Location**: `shared/utils/typed-submit.ts` — imported via `@/utils`

## API

| Function                           | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `createTypedSubmit(type, data?)`   | Creates FormData with `_type` field + optional payload          |
| `parseTypedSubmit(request)`        | Async parse from Request → `{ type, data, formData }` or `null` |
| `parseTypedSubmitFromFormData(fd)` | Sync parse from existing FormData                               |
| `isSubmitType(result, type)`       | Type guard for narrowing `result.type`                          |

## Component Side

```tsx
import { createTypedSubmit } from "@/utils";

import { useSubmit } from "react-router";

submit(createTypedSubmit("anonymization"), { method: "POST" });
submit(createTypedSubmit("update-settings", { theme: "dark" }), {
  method: "POST",
});
```

## Action Side

```tsx
import { createRouteService } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { parseTypedSubmit } from "@/utils";

import { data } from "react-router";

class RouteService extends BaseService {}

export async function action({ request, context }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);
  if (!result) return data(route.formError({ general: "Invalid request" }));

  switch (result.type) {
    case "anonymization": {
      const res = await context.services.user.requestAnonymization(request);
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

## Rules

- Descriptive type names: `"anonymization"`, `"update-profile"`, `"delete-account"`
- Always handle unknown types with default → `route.formError()`
- Use generic for type safety: `parseTypedSubmit<"a" | "b">(request)`
- Use `isSubmitType(result, "a")` for type narrowing outside switch
- Dispatch stays in route, service logic in RouteService or `context.services.*`
