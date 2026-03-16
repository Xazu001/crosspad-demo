import { cloudflare } from "@cloudflare/vite-plugin";

import { reactRouter } from "@react-router/dev/vite";

import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

type AppEnv = "local" | "prod";

const APP_ENV_VALUES: AppEnv[] = ["local", "prod"];

function resolveAppEnv(command: "serve" | "build"): AppEnv {
  const rawAppEnv = (process.env.APP_ENV ?? "").toLowerCase();

  if (APP_ENV_VALUES.includes(rawAppEnv as AppEnv)) {
    return rawAppEnv as AppEnv;
  }

  const cloudflareEnv = (process.env.CLOUDFLARE_ENV ?? "prod").toLowerCase();

  if (cloudflareEnv === "prod") return "prod";
  return "local";
}

// Type for Vite's WebSocket error data
interface WSErrorData {
  err?: Error;
  message?: string;
  [key: string]: any;
}

export default defineConfig(({ command }) => {
  const appEnv = resolveAppEnv(command);
  const isDevEnv = appEnv !== "prod";

  return {
    define: {
      // Build/runtime constants injected by Vite
      IS_DEV: JSON.stringify(isDevEnv),
      __APP_ENV__: JSON.stringify(appEnv),
    },
    plugins: [
      tsconfigPaths({ projects: ["./tsconfig.cloudflare.json"] }),
      cloudflare({
        viteEnvironment: { name: "ssr" },
      }),
      reactRouter(),
      // Custom plugin to handle SCSS error recovery
      {
        name: "scss-error-recovery",
        configureServer(server) {
          let hasScssError = false;
          let isReloading = false;

          server.ws.on("connection", () => {
            console.log("🔥 HMR Connected - SCSS errors will auto-recover!");
          });

          // Listen for build errors
          server.ws.on("error", (data: WSErrorData) => {
            const err = data.err?.message || data.message || data;
            if (
              typeof err === "string" &&
              (err.includes("scss") ||
                err.includes("sass") ||
                err.includes(".scss") ||
                err.includes("SassError"))
            ) {
              hasScssError = true;
              console.log("❌ SCSS Error detected - will full reload on next change");
              console.log("   Error:", err.substring(0, 200) + (err.length > 200 ? "..." : ""));
            }
          });

          // Listen for HMR updates
          server.ws.on("update", (data) => {
            // Check if any of the updated files are SCSS
            const hasScssUpdate = data.updates?.some(
              (update: any) =>
                update.type === "css" || (update.path && update.path.endsWith(".scss")),
            );

            if (hasScssUpdate && hasScssError && !isReloading) {
              console.log("🔄 SCSS file updated after error - forcing full reload...");
              isReloading = true;
              hasScssError = false;

              // Send full reload to all clients
              server.ws.send({ type: "full-reload" });

              // Reset reload flag after a delay
              setTimeout(() => {
                isReloading = false;
              }, 1000);
            }
          });

          // Also watch file system changes as backup
          const watcher = server.watcher;
          watcher.on("change", (file) => {
            if (file.endsWith(".scss") && hasScssError && !isReloading) {
              console.log("🔄 SCSS file change detected after error - forcing full reload...");
              isReloading = true;
              hasScssError = false;

              // Send full reload to all clients
              server.ws.send({ type: "full-reload" });

              // Reset reload flag after a delay
              setTimeout(() => {
                isReloading = false;
              }, 1000);
            }
          });
        },
      },
    ],
    // SSR config usunięty - Cloudflare Vite plugin nie obsługuje resolve.external
    // nodejs_compat w wrangler config zapewnia kompatybilność z modułami Node.js
    server: {
      host: "0.0.0.0",
      port: 5173,
      hmr: {
        host: "localhost",
        port: 5173,
        overlay: true,
      },
      watch: {
        // Watch for SCSS file changes more aggressively
        usePolling: false,
        interval: 100,
        // Always watch SCSS files even after errors
        ignored: ["!**/*.scss"],
      },
      // Add better headers for cache control
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
    resolve: {
      alias: {
        "#": path.resolve(__dirname, "./app"),
        $: path.resolve(__dirname, "./server"),
        "@": path.resolve(__dirname, "./shared"),
        midifun: path.resolve(__dirname, "./packages/midifun/src"),
        "midifun/react": path.resolve(__dirname, "./packages/midifun/src/react"),
        "@abstracts": path.resolve(__dirname, "./app/style/abstracts/_index.scss"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
      devSourcemap: true,
      // Disable CSS modules for better HMR with regular CSS
      modules: false,
    },
    optimizeDeps: {
      include: [
        "react-router",
        "react",
        "react-dom",
        "react-toastify",
        "zustand",
        "gsap",
        "framer-motion",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "@otplib/plugin-crypto-noble",
        "@otplib/plugin-base32-scure",
      ],
      // Exclude problematic dependencies from pre-bundling
      exclude: [],
      // Force rebuild on SCSS changes
      force: false, // Changed to false for better performance
      // Add better cache handling
      holdUntilCrawlEnd: true,
    },
    // Better handling for TypeScript files in scripts
    esbuild: {
      target: "esnext",
    },
    build: {
      cssCodeSplit: false,
      modulePreload: {
        polyfill: false,
      },
    },
    // Experimental: Better error handling
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === "js") {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});
