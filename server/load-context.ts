import type { Services } from "$/core";

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
      ASSETS: Fetcher;
    };
    services: Services;
  }
}
