import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

// import { watch } from "chokidar";

const app = new Hono();

// Store clients for broadcasting
const clients = new Set<any>();

// SSE endpoint for HMR
app.get("/events", async (c) => {
  return streamSSE(c, async (stream: any) => {
    clients.add(stream);

    // Send initial connection event
    await stream.writeSSE({ data: "connected", event: "open" });

    // Keep connection alive
    while (true) {
      await stream.writeSSE({ data: "ping", event: "ping" });
      await stream.sleep(30000);
    }
  });
});

export default app;
