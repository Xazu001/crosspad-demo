import { getCronHandler } from "$/cloudflare/crons";
import { QueueManager } from "$/cloudflare/queue";
import { createApp } from "$/setup";
import type { Env } from "$/setup";

import { createRequestHandler } from "react-router";

// Create a Hono app with services middleware
const app = createApp();

/* React Router Handler */
app.all("*", async (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build" as any),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: {
      env: c.env,
      ctx: c.executionCtx as ExecutionContext,
      ASSETS: c.env.ASSETS!,
    },
    services: c.get("services"),
  });
});

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.queue) {
      console.error("[Queue] Queue binding not configured");
      return;
    }
    const queue = new QueueManager(env.queue);
    await queue.processBatch(batch, env, ctx);
  },
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const handler = await getCronHandler(controller.cron);
    if (handler) {
      await handler.handler(controller, env, ctx);
    } else {
      console.log(`[Cron] No handler registered for: ${controller.cron}`);
    }
  },
};
