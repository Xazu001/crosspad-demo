import { data } from "react-router";

import { createRouteService, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Route } from "./+types/contact";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @formMethod({ general: "Failed to submit contact form" })
  async submitContactForm(request: Request) {
    await this.rateLimit(request);
    return await this.user.submitContactForm(request);
  }
}

// ──────────────────────────────────────────────────────────────
// Action
// ──────────────────────────────────────────────────────────────

export const action = async ({ context, request }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);
  const res = await route.submitContactForm(request);
  return data(res);
};
