// ──────────────────────────────────────────────────────────────
// Admin API Router
// ──────────────────────────────────────────────────────────────
// Routes that require admin session authentication.
// All routes under /api/admin/* are protected by adminMiddleware.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";

import { Hono } from "hono";

import { adminMiddleware } from "../../middleware/admin";
import type { Env } from "../../setup";
import cliApi from "./cli";

const admin = new Hono<{
  Bindings: Env;
  Variables: { services: Services };
}>();

// Apply admin session middleware to all routes
admin.use("*", adminMiddleware);

// Mount CLI API at /cli (becomes /api/admin/cli)
admin.route("/cli", cliApi);

export default admin;
