// ──────────────────────────────────────────────────────────────
// User API Router
// ──────────────────────────────────────────────────────────────
// Handles user-related endpoints: anonymization undo, kit deletion, etc.
// ──────────────────────────────────────────────────────────────
import type { Services } from "$/core";

import { Hono } from "hono";

import type { Env } from "../../setup";
import { anonymizeUndoHandler } from "./anonymize-undo";

const user = new Hono<{ Bindings: Env; Variables: { services: Services } }>();

// Undo account anonymization within grace period (GET)
user.get("/anonymize-undo/:undoCode", anonymizeUndoHandler);

export default user;
