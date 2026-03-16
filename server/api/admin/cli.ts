// ──────────────────────────────────────────────────────────────
// Admin CLI API Router
// ──────────────────────────────────────────────────────────────
// Routes for admin CLI commands. All routes require admin session.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";
import { apiError, apiSuccess } from "$/lib/response";

import type { Context } from "hono";
import { Hono } from "hono";

import type { Env } from "../../setup";

const cli = new Hono<{
  Bindings: Env;
  Variables: { services: Services };
}>();

/**
 * Handle user deletion via CLI command.
 *
 * DELETE /api/admin/cli/users/:userId
 *
 * Requires admin authentication via session.
 */
const cliDeleteUserHandler = async (
  c: Context<{
    Bindings: Env;
    Variables: { services: Services };
  }>,
) => {
  const services = c.get("services");
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json(apiError("User ID is required"), 400);
  }

  try {
    const result = await services.admin.deleteUser(userId, c.req.raw);

    if (result.success) {
      return c.json(apiSuccess(result.result));
    }

    return c.json(result, 400);
  } catch (error) {
    console.error("[CLI API] Delete user error:", error);
    return c.json(apiError("Failed to delete user"), 500);
  }
};

/**
 * Handle granting user rights via CLI command.
 *
 * PUT /api/admin/cli/users/:userId/rights
 *
 * Body: { admin?: boolean, create_kit?: boolean }
 */
const cliGrantRightsHandler = async (
  c: Context<{
    Bindings: Env;
    Variables: { services: Services };
  }>,
) => {
  const services = c.get("services");
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json(apiError("User ID is required"), 400);
  }

  try {
    const body = await c.req.json<{ admin?: boolean; create_kit?: boolean }>();
    const result = await services.admin.grantRights(userId, body, c.req.raw);

    if (result.success) {
      return c.json(apiSuccess(result.result));
    }

    return c.json(result, 400);
  } catch (error) {
    console.error("[CLI API] Grant rights error:", error);
    return c.json(apiError("Failed to grant rights"), 500);
  }
};

/**
 * Handle user search via CLI command.
 *
 * GET /api/admin/cli/users?search=<query>&limit=<number>&offset=<number>
 *
 * Query params:
 * - search: Search string to filter by user_name or user_namespace
 * - limit: Max results (default 50)
 * - offset: Pagination offset (default 0)
 */
const cliGetUsersHandler = async (
  c: Context<{
    Bindings: Env;
    Variables: { services: Services };
  }>,
) => {
  const services = c.get("services");
  const search = c.req.query("search");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  try {
    const result = await services.admin.getUsers({
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return c.json(apiSuccess(result));
  } catch (error) {
    console.error("[CLI API] Get users error:", error);
    return c.json(apiError("Failed to get users"), 500);
  }
};

// User management
cli.get("/users", cliGetUsersHandler);
cli.delete("/users/:userId", cliDeleteUserHandler);
cli.put("/users/:userId/rights", cliGrantRightsHandler);

export default cli;
