import { redirect } from "react-router";

import { createRouteService, loaderMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "./+types/index";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @loaderMethod()
  async requireAdmin(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      const url = new URL(request.url);
      throw redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    const isAdmin = await this.admin.isUserAdmin(user.user_id);

    if (!isAdmin) {
      this.throw(this.responses.getNoAccess("You don't have access to this page"));
    }

    return this.ok(user);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  await route.requireAdmin(request);
  return null;
}
