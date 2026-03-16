import { data, redirect } from "react-router";

import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { parseTypedSubmit } from "@/utils/typed-submit";

import type { Route } from "./+types/edit";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getEditPageData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    const kits = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .selectAll()
        .where("user_id", "=", user.user_id)
        .execute()
    );

    const totpEnabled = await this.user.hasTotpEnabled(user.user_id);

    const transferCodesResult =
      await this.kitTransfer.listUserTransferCodes(request);
    const transferCodes = transferCodesResult.success
      ? transferCodesResult.result
      : [];

    return this.ok({ kits, totpEnabled, transferCodes });
  }

  @formMethod({ general: "Failed to delete kit" })
  async deleteKit(request: Request, kitId: number, totpCode?: string) {
    await this.rateLimit(request);
    return await this.kit.requestDeletion(request, kitId, totpCode);
  }

  @formMethod({ general: "Failed to create transfer code" })
  async createTransferCode(request: Request, kitId: number) {
    await this.rateLimit(request);
    return await this.kitTransfer.createTransferCode(request, kitId);
  }

  @formMethod({ general: "Failed to cancel transfer code" })
  async cancelTransferCode(request: Request, code: string) {
    await this.rateLimit(request);
    return await this.kitTransfer.cancelTransferCode(request, code);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Load all kits created by the current user */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await route.getEditPageData(request);
  return data(result);
};

// ──────────────────────────────────────────────────────────────
// Action
// ──────────────────────────────────────────────────────────────

/** Handle kit deletion and transfer via typed submit */
export const action = async ({ request, context }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);

  if (!result) {
    return data(route.formError({ general: "Invalid request" }));
  }

  switch (result.type) {
    case "delete-kit": {
      const kitId = parseInt(result.data.kitId as string, 10);
      const totpCode = result.data.totpCode as string | undefined;

      if (isNaN(kitId)) {
        return data(route.formError({ general: "Invalid kit ID" }));
      }

      const res = await route.deleteKit(request, kitId, totpCode);
      return data(res);
    }

    case "create-transfer-code": {
      const kitId = parseInt(result.data.kitId as string, 10);

      if (isNaN(kitId)) {
        return data(route.formError({ general: "Invalid kit ID" }));
      }

      const res = await route.createTransferCode(request, kitId);
      return data(res);
    }

    case "cancel-transfer-code": {
      const { code } = result.data as { code: string };

      const res = await route.cancelTransferCode(request, code);
      return data(res);
    }

    default:
      return data(route.formError({ general: "Unknown action" }));
  }
};
