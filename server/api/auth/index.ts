// ──────────────────────────────────────────────────────────────
// Authentication API Router
// ──────────────────────────────────────────────────────────────
// Handles user authentication endpoints: login, register, confirm email.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";

import { Hono } from "hono";

import type { Env } from "../../setup";
import { confirmHandler } from "./confirm";

const auth = new Hono<{ Bindings: Env; Variables: { services: Services } }>();

// Confirm email address with verification code (GET)
auth.get("/confirm/:verificationCode", confirmHandler);

export default auth;
