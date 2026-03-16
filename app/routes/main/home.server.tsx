import { data, redirect } from "react-router";

import { isCrawler } from "#/lib/seo";
import { createRouteService, dataMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import * as preferences from "@/preferences";

import type { Route } from "./+types/home";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getPublishedKits() {
    const kits = await this.cache.getOrSet(
      "kits:home",
      async () =>
        await this.exDbOperation(() =>
          this.db.op.selectFrom("published_kits").selectAll().execute()
        )
    );
    return this.ok(kits);
  }

  @dataMethod()
  async checkLandingRedirect(request: Request) {
    if (!isCrawler(request)) {
      const hasVisitedLanding = await preferences.hasVisitedLanding(request);
      if (!hasVisitedLanding) {
        throw redirect("/landing");
      }
    }
    return this.none();
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Load published kits for home page with caching */
export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  
  await route.checkLandingRedirect(request);
  const result = await route.getPublishedKits();

  return data({ kits: result });
};
