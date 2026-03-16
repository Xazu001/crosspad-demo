import { data } from "react-router";

import { createRouteService, loaderMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "./+types/layout";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @loaderMethod()
  async protectKitCreation(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user?.user_create_kit) {
      this.throw(
        this.responses.getNoAccess(
          "You must be logged in and own access to create Kit!"
        )
      );
    }

    return this.ok(null);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Protect kit creation routes - check user permissions */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await route.protectKitCreation(request);
  return data(result);
};
