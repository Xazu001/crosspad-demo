// ──────────────────────────────────────────────────────────────
// Private API Router
// ──────────────────────────────────────────────────────────────
// Routes that require API key authentication.
// All routes under /api/priv/* are protected by privMiddleware.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";

import { Hono } from "hono";

import { privMiddleware } from "../../middleware/priv";
import type { Env } from "../../setup";

const priv = new Hono<{
  Bindings: Env & { PRIV_API_KEY: string };
  Variables: { services: Services };
}>();

// Apply API key middleware to all routes
priv.use("*", privMiddleware);

export default priv;
