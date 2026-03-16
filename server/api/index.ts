// ──────────────────────────────────────────────────────────────
// API Router
// ──────────────────────────────────────────────────────────────
// Main API router that handles all /api/* routes.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";

import { Hono } from "hono";

import type { Env } from "../setup";
import adminApi from "./admin";
import authApi from "./auth";
import devApi from "./dev";
import mailPreviews from "./mail-previews";
import privApi from "./priv";
import userApi from "./user";

const api = new Hono<{ Bindings: Env; Variables: { services: Services } }>();

// Mount authentication API at /auth (becomes /api/auth)
api.route("/auth", authApi);

// Mount user API at /user (becomes /api/user)
api.route("/user", userApi);

// Mount admin API at /admin (becomes /api/admin)
api.route("/admin", adminApi);

// Mount mail previews API at /mail-previews (becomes /api/mail-previews)
api.route("/mail-previews", mailPreviews);

// Mount private API routes at /priv (becomes /api/priv)
api.route("/priv", privApi);

// Mount dev API routes at /_dev (becomes /api/_dev) - for testing crons, etc.
api.route("/_dev", devApi);

export default api;
