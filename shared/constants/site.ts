// Injected by Vite in app/worker builds (see vite.config.ts)
declare const __APP_ENV__: "local" | "prod";

export const APP_GTAG = "G-XXXXXX";

export const APP_ENV = __APP_ENV__;

type AppEnv = "local" | "prod";

const siteUrlMap: Record<AppEnv, string> = {
  local: "http://localhost:5173",
  prod: "XXXXXX",
};

export const SITE_URL = siteUrlMap[__APP_ENV__];

const r2UrlMap: Record<AppEnv, string> = {
  local: "XXXXXX",
  prod: "XXXXXX",
};

export const R2_URL = r2UrlMap[__APP_ENV__];
