import { data } from "react-router";

import { createRouteService, loaderMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "./+types/layout";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @loaderMethod()
  async protectProfilePage(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw(
        this.responses.getNoAccess("You must be logged in to access this page!")
      );
    }

    return this.ok(null);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Protect profile routes - redirect to login if not authenticated */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const result = await route.protectProfilePage(request);
  return data(result);
};
