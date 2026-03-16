import { data, redirect } from "react-router";

import { createRouteService, dataMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "./+types/layout";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getKitForEdit(kitId: number, request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    const kit = await this.kit.getKitById(kitId, request);

    if (!kit || kit.owner?.user_id !== user.user_id) {
      this.throw(
        this.responses.getNoAccess(
          "You don't have access to edit this kit!"
        )
      );
    }

    return this.ok({ kit });
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await route.getKitForEdit(Number(params.kitId), request);
  return data(result);
};
