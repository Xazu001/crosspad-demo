---
description: Add 2FA verification to sensitive actions (conditional - only if user enabled it)
auto_execution_mode: 3
---

# Add 2FA Verification to Action

Add conditional 2FA verification to sensitive actions. 2FA is only required if the user has enabled it on their account.

## When to Use

- Deleting resources (kits, samples, groups)
- Account anonymization/deletion
- Changing sensitive security settings
- Any potentially dangerous action

## Pattern Selection

| Pattern          | Use Case                                     | Components                                             |
| ---------------- | -------------------------------------------- | ------------------------------------------------------ |
| **Uncontrolled** | Self-contained modal with trigger button     | `TotpModal` or `TotpModalTrigger` + `TotpModalContent` |
| **Controlled**   | External control (toggle, programmatic open) | `Modal` + `TotpModalContent` + `useTotpModalStore`     |

---

## Pattern 1: Uncontrolled (Simple)

Use when the modal is triggered by a button click and doesn't need external control.

```tsx
import { TotpModal } from "#/components/custom/totp-modal";

// In your component
<TotpModal
  title="Delete Resource"
  message="Are you sure? This action is permanent."
  totpEnabled={totpEnabled}
  onConfirm={(totpCode) => deleteResource(resourceId, totpCode)}
  isLoading={isDeleting}
  error={deleteError}
  triggerProps={{
    variant: "destructive",
    children: "Delete",
  }}
  confirmVariant="destructive"
  confirmText="Confirm Delete"
/>;
```

### With Custom Trigger (e.g., MenubarItem)

```tsx
import { TotpModalContent, TotpModalTrigger } from "#/components/custom/totp-modal";
import { Modal } from "#/components/ui/modal";

<Modal>
  <TotpModalTrigger>
    <MenubarItem className="menubar__item--destructive">
      <Icon.Trash size="sm" />
      <span>Delete</span>
    </MenubarItem>
  </TotpModalTrigger>
  <TotpModalContent
    title="Delete Resource"
    message="Are you sure? This action is permanent."
    totpEnabled={totpEnabled}
    onConfirm={(totpCode) => deleteResource(resourceId, totpCode)}
    isLoading={isDeleting}
    error={deleteError}
    confirmVariant="destructive"
    confirmText="Confirm Delete"
  />
</Modal>;
```

---

## Pattern 2: Controlled (With Store)

Use when you need to open the modal programmatically (e.g., from a toggle switch).

### Step 1: Import Store and Components

```tsx
import { TotpModalContent } from "#/components/custom/totp-modal";
import { Modal } from "#/components/ui/modal";
import { useTotpModalStore } from "#/lib/stores/two-factor-settings";
```

### Step 2: Use Store in Component

```tsx
const { isOpen, totpCode, error, isLoading, setTotpCode, setError, setIsLoading, open, close } =
  useTotpModalStore();

// Open modal programmatically
const handleToggle = (checked: boolean) => {
  if (!checked) {
    open(); // Opens the TOTP modal
  }
};

// Handle confirmation
const handleConfirm = (code?: string) => {
  if (code) {
    setIsLoading(true);
    // Call your action
    performAction(code);
  }
};
```

### Step 3: Render Modal

```tsx
<Modal open={isOpen} onOpenChange={(open) => !open && close()}>
  <TotpModalContent
    title="Disable Feature"
    message="Are you sure you want to disable this?"
    totpEnabled={totpEnabled}
    onConfirm={handleConfirm}
    isLoading={isLoading}
    error={error ?? undefined}
    totpCode={totpCode}
    onTotpCodeChange={setTotpCode}
    showCancel
    onCancel={close}
    confirmVariant="destructive"
    confirmText="Confirm"
  />
</Modal>
```

---

## Route Action (Server-Side)

In the route action, verify 2FA before executing the sensitive action:

```tsx
import { createRouteService, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { parseTypedSubmit } from "@/utils/typed-submit";
import { data } from "react-router";

class RouteService extends BaseService {
  @formMethod({ general: "Action failed" })
  async deleteResource(resourceId: string, totpCode?: string) {
    // Service logic here
    return this.formSuccess({ deleted: true });
  }
}

export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);
  if (!result) return data(route.formError({ general: "Invalid action" }));

  const user = await context.services.auth.getUserFromRequest(request);
  if (!user) return data(route.formError({ general: "Not authenticated" }));

  const { totpCode } = result.data as { totpCode?: string };
  const totpEnabled = await context.services.user.hasTotpEnabled(user.user_id);

  // Verify 2FA if enabled
  if (totpEnabled) {
    if (!totpCode) {
      return data(route.formError({ totp: "2FA code is required" }));
    }
    const verifyResult = await context.services.user.verifyTotpCode(user.user_id, totpCode);
    if (!verifyResult.success) return data(verifyResult);
  }

  // Execute action after 2FA check
  switch (result.type) {
    case "delete-resource": {
      const res = await route.deleteResource(result.data.resourceId, totpCode);
      return data(res);
    }
    default:
      return data(route.formError({ general: "Unknown action" }));
  }
}
```

---

## Key Points

- **Conditional**: 2FA is only required if `hasTotpEnabled()` returns true
- **Route-level verification**: Check 2FA in route action before calling service methods
- **TOTP code field**: Always accept `totpCode` in request data, only validate if 2FA enabled
- **Error handling**: Use `route.formError()` for inline errors, wrap returns with `data()`
- **Uncontrolled pattern**: Simpler, use for self-contained modals with trigger buttons
- **Controlled pattern**: Use `useTotpModalStore` when you need external control

## Service Methods

- `context.services.user.hasTotpEnabled(userId)` → `Promise<boolean>`
- `context.services.user.verifyTotpCode(userId, code)` → `Promise<FormResponseResult>`
