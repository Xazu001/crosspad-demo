// ──────────────────────────────────────────────────────────────
// Admin API Middleware
// ──────────────────────────────────────────────────────────────
// Validates admin session for admin API endpoints.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";
import type { Env } from "$/setup";

import type { Context, Next } from "hono";

/**
 * Middleware that validates the user is authenticated and has admin privileges.
 * Returns 401 if not authenticated, 403 if not admin.
 */
export async function adminMiddleware(
  c: Context<{
    Bindings: Env;
    Variables: { services: Services };
  }>,
  next: Next,
) {
  const services = c.get("services");

  // Get user from session
  const user = await services.auth.getUserFromRequest(c.req.raw);

  if (!user) {
    return c.json({ success: false, errors: { general: "Authentication required" } }, 401);
  }

  // Check admin privileges
  const isAdmin = await services.admin.isUserAdmin(user.user_id);

  if (!isAdmin) {
    return c.json({ success: false, errors: { general: "Admin privileges required" } }, 403);
  }

  // Store user in context for handlers
  c.set("user" as any, user);

  await next();
}
