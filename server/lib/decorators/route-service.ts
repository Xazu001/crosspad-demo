import type { Services } from "$/core";
import { type BaseService, type ServiceContainer } from "$/services/base";

/**
 * Context passed to route service factory.
 * Matches React Router's AppLoadContext shape.
 */
interface RouteServiceContext {
  services: Services;
  cloudflare?: {
    env: Env;
    ctx: ExecutionContext;
    ASSETS: Fetcher;
  };
}

/**
 * Create a one-off service instance for a route.
 * Use for route-specific logic that doesn't warrant a full service file.
 *
 * Naming convention: Always name the class `RouteService`.
 *
 * @example
 * ```typescript
 * // In route file
 * class RouteService extends BaseService {
 *   @dataMethod()
 *   async getPublishedKits() {
 *     const kits = await this.exDbOperation(() =>
 *       this.db.op.selectFrom("published_kits").selectAll().execute()
 *     );
 *     return this.ok(kits);
 *   }
 * }
 *
 * export const loader = async ({ context }: Route.LoaderArgs) => {
 *   const route = createRouteService(RouteService, context);
 *   const kits = await route.getPublishedKits();
 *   return data({ kits });
 * };
 * ```
 */
export function createRouteService<T extends typeof BaseService>(
  ServiceClass: T,
  context: RouteServiceContext,
): InstanceType<T> {
  const { services } = context;
  const service = new ServiceClass(services.base.db) as InstanceType<T>;

  // Build ServiceContainer from Services (excludes base/preferences)
  const container: ServiceContainer = {
    admin: services.admin,
    auth: services.auth,
    user: services.user,
    kit: services.kit,
    kitTransfer: services.kitTransfer,
  };

  service.setServices(() => container);

  if (context.cloudflare?.env) {
    service.initializeManagers(context.cloudflare.env);
  }

  return service;
}
