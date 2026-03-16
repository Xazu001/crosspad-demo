---
description: Add typed submit action to route with multiple form handlers
auto_execution_mode: 3
---

# Generate Typed Action

Add multiple submit handlers to a route using typed submits.

## Steps

1. Read `.windsurf/rules/typed-submit.md`

2. In component, create typed submit:

```tsx
import { createTypedSubmit } from "@/utils/typed-submit";

// When submitting
submit(createTypedSubmit("action-name"), { method: "POST" });
```

3. In route action, create RouteService and dispatch:

```tsx
import { createRouteService, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { parseTypedSubmit } from "@/utils/typed-submit";

import { data } from "react-router";

class RouteService extends BaseService {
  @formMethod({ general: "Action one failed" })
  async actionOne(request: Request) {
    // Service logic here
    return this.formSuccess({ done: true });
  }
}

export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);
  if (!result) return data(route.formError({ general: "Invalid action" }));

  switch (result.type) {
    case "action-one": {
      const res = await route.actionOne(request);
      return data(res);
    }
    case "action-two": {
      const res = await context.services.kit.someMethod(request);
      return data(res);
    }
    default:
      return data(route.formError({ general: "Unknown action" }));
  }
}
```

4. Each action type should have a clear, descriptive name
