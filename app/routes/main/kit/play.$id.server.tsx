import { data } from "react-router";

import { createRouteService, dataMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import { FEATURED_AUTHORS, KIT_TO_AUTHOR_MAP } from "@/constants";
import { env } from "cloudflare:workers";

import type { Route } from "./+types/play.$id";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

type NewKitData = Awaited<ReturnType<RouteService["_getKitData"]>> & {
  owner: {
    is_featured: boolean;
  };
};

class RouteService extends BaseService {
  @dataMethod()
  private _getKitData(id: string, request: Request) {
    return this.kit.getKitById(parseInt(id), request);
  }

  @dataMethod()
  async getKitData(id: string, request: Request) {
    const kitData = await this.cache.getOrSet(
      `kit:play:${id}`,
      async () => this._getKitData(id, request),
      60 * 60 * 1, // 1 hour
    );

    if (!kitData) {
      this.throw(this.responses.getNotFound("Kit not found"));
    }

    Object.assign(kitData.owner, { is_featured: false });

    changeOwnerInfo(kitData as NewKitData);

    return this.ok(kitData as NewKitData);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Load kit data by ID */
export const loader = async ({ context, request, params }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const kitData = await route.getKitData(params.id as string, request);
  return data(kitData);
};

// Using this for authors from legacy version of crosspad.app
function changeOwnerInfo(kitData: NewKitData) {
  if (env.IS_DEV) {
    const author = FEATURED_AUTHORS.find((author) => {
      return kitData.kit_description.endsWith(author.kits_description_pattern);
    });

    if (author) {
      kitData.owner.user_name = author.user_name;
      kitData.owner.user_namespace = author.user_namespace;
      kitData.owner.user_avatar_source = author.user_avatar_source || "";

      kitData.owner.is_featured = true;
    }
  } else {
    if (KIT_TO_AUTHOR_MAP.has(kitData.kit_id)) {
      const author = KIT_TO_AUTHOR_MAP.get(kitData.kit_id);
      if (author) {
        kitData.owner.user_name = author.user_name;
        kitData.owner.user_namespace = author.user_namespace;
        kitData.owner.user_avatar_source = author.user_avatar_source || "";
        kitData.owner.is_featured = true;
      }
    }
  }
}
