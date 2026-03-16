// ──────────────────────────────────────────────────────────────
// Dev API Routes
// ──────────────────────────────────────────────────────────────
// Development-only endpoints for testing crons, queues, etc.
// ──────────────────────────────────────────────────────────────
import { getAllCronHandlers, getCronHandler } from "$/cloudflare/crons";
import type { Services } from "$/core";

import { Hono } from "hono";

import type { Env } from "../setup";

const dev = new Hono<{ Bindings: Env; Variables: { services: Services } }>();

/**
 * Test cron handlers manually during development
 *
 * Usage:
 * GET /api/_dev/cron - Test default cron (0 0 * * *)
 * GET /api/_dev/cron?cron=0+0+*+*+* - Test specific pattern
 * GET /api/_dev/cron?all=true - Test ALL registered cron handlers
 */
dev.get("/cron", async (c) => {
  const isDev = import.meta.env.DEV || c.env.IS_DEV;

  if (!isDev) {
    return c.json({ error: "Cron testing endpoint is only available in dev mode" }, 403);
  }

  // Test all handlers mode
  if (c.req.query("all") === "true") {
    const allHandlers = await getAllCronHandlers();
    const results: Array<{ cron: string; success: boolean; error?: string }> = [];

    for (const { cron, handler } of allHandlers) {
      try {
        await handler(
          { cron, scheduledTime: Date.now() } as ScheduledController,
          c.env,
          c.executionCtx as ExecutionContext,
        );
        results.push({ cron, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ cron, success: false, error: errorMessage });
      }
    }

    return c.json({
      success: true,
      message: `Executed ${allHandlers.length} cron handlers`,
      results,
    });
  }

  // Single handler mode
  const cron = c.req.query("cron") || "0 0 * * *";

  const handler = await getCronHandler(cron);

  if (!handler) {
    return c.json({ error: `No handler found for cron: ${cron}` }, 404);
  }

  try {
    await handler.handler(
      { cron, scheduledTime: Date.now() } as ScheduledController,
      c.env,
      c.executionCtx as ExecutionContext,
    );

    return c.json({
      success: true,
      cron,
      message: "Cron executed successfully - check console for handler logs",
    });
  } catch (error) {
    console.error(`[Dev Cron] Handler execution failed:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: "Cron handler execution failed", details: errorMessage }, 500);
  }
});

export default dev;
