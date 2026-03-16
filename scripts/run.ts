// Unified Script Runner - interactive menu or CLI args for all scripts.
import { execSync } from "child_process";

import { defineCommand, runMain } from "citty";
import * as readline from "readline";

// ============================================================================
// COMMANDS REGISTRY
// ============================================================================

interface ScriptCommand {
  name: string;
  description: string;
  file: string;
  needsEnv: boolean;
  tsconfig?: string;
}

const scripts: ScriptCommand[] = [
  // Env-dependent
  {
    name: "db-dump",
    description: "Clear all tables from D1 database",
    file: "db-dump.ts",
    needsEnv: true,
  },
  {
    name: "r2-dump",
    description: "Clear all objects from R2 bucket",
    file: "r2-dump.ts",
    needsEnv: true,
  },
  {
    name: "download-r2",
    description: "Download objects from R2 bucket",
    file: "download-r2.ts",
    needsEnv: true,
  },
  {
    name: "seed-categories",
    description: "Seed default categories to DB",
    file: "seed-categories.ts",
    needsEnv: true,
  },

  // Demo setup (for public repo)
  {
    name: "demo:env-example",
    description: "Generate .env.example template",
    file: "demo/generate-env-example.ts",
    needsEnv: false,
  },
  {
    name: "demo:wrangler",
    description: "Generate wrangler.jsonc template",
    file: "demo/generate-wrangler-template.ts",
    needsEnv: false,
  },
  {
    name: "demo:delete-comments",
    description: "Remove comments from .env and wrangler",
    file: "demo/delete-comments.ts",
    needsEnv: false,
  },
  {
    name: "demo:drizzle-config",
    description: "Generate drizzle.config.ts",
    file: "demo/generate-drizzle-config.ts",
    needsEnv: false,
  },

  // Utilities
  {
    name: "generate-graph",
    description: "Generate PWA icons & OG graph",
    file: "generate-graph.ts",
    needsEnv: false,
  },
  {
    name: "generate-api-key",
    description: "Generate secure API keys",
    file: "generate-api-key.ts",
    needsEnv: false,
  },
  {
    name: "encode-keys",
    description: "Encode PEM keys to base64",
    file: "encode-keys.ts",
    needsEnv: false,
  },
  {
    name: "generate-robots",
    description: "Generate robots.txt for SEO",
    file: "generate-robots.ts",
    needsEnv: false,
  },
  {
    name: "generate-sitemap",
    description: "Generate sitemap.xml for SEO",
    file: "generate-sitemap.ts",
    needsEnv: false,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function ask(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function resolveScript(input: string): ScriptCommand | undefined {
  const num = parseInt(input);
  if (!isNaN(num) && num >= 1 && num <= scripts.length) {
    return scripts[num - 1];
  }
  // Try exact match first
  let script = scripts.find((c) => c.name === input);
  if (script) return script;
  // Try route-style path: demo/generate-env-example -> demo:env-example
  const routeMatch = input.match(/^(.+)\/generate-(.+)$/);
  if (routeMatch) {
    const colonName = `${routeMatch[1]}:${routeMatch[2]}`;
    script = scripts.find((c) => c.name === colonName);
    if (script) return script;
  }
  // Try replacing / with : for other cases
  const colonInput = input.replace("/", ":");
  return scripts.find((c) => c.name === colonInput);
}

function printScriptList() {
  const envScripts = scripts.filter((c) => c.needsEnv);
  const utilScripts = scripts.filter((c) => !c.needsEnv);

  console.log("\n  📦 Environment commands:\n");
  envScripts.forEach((cmd, i) => {
    console.log(`    ${String(i + 1).padStart(2)}. ${cmd.name.padEnd(20)} ${cmd.description}`);
  });

  console.log("\n  🔧 Utility commands:\n");
  utilScripts.forEach((cmd, i) => {
    const num = envScripts.length + i + 1;
    console.log(`    ${String(num).padStart(2)}. ${cmd.name.padEnd(20)} ${cmd.description}`);
  });

  console.log("");
}

async function promptEnv(scriptName: string): Promise<string> {
  console.log(`\n  🌍 Select environment for "${scriptName}":\n`);
  console.log("     1. dev   (crosspad-x-dev)");
  console.log("     2. prod  (crosspad-x)");
  console.log("");

  const envInput = await ask("  Select (1/2): ");

  if (envInput === "1" || envInput === "dev") return "dev";
  if (envInput === "2" || envInput === "prod") return "prod";

  console.log("\n  ❌ Invalid environment\n");
  process.exit(1);
}

function runScript(script: ScriptCommand, env: string) {
  const tsconfig = script.tsconfig ? ` --tsconfig ${script.tsconfig}` : "";
  const cmd = `npx tsx${tsconfig} scripts/${script.file}`;

  console.log(`\n  ▶ Running "${script.name}"${env ? ` on ${env.toUpperCase()}` : ""}...\n`);

  try {
    execSync(cmd, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...(env ? { SCRIPT_ENV: env } : {}),
      },
    });
  } catch {
    process.exit(1);
  }
}

// ============================================================================
// CLI DEFINITION
// ============================================================================

const main = defineCommand({
  meta: {
    name: "crosspad-scripts",
    description: "⚡ Crosspad Scripts Runner",
  },
  args: {
    command: {
      type: "positional",
      description: "Script name or number to run (omit for interactive menu)",
      required: false,
    },
    env: {
      type: "string",
      alias: "e",
      description: "Environment: dev or prod (for env-dependent scripts)",
    },
    list: {
      type: "boolean",
      alias: "l",
      description: "List all available scripts",
    },
  },
  async run({ args }) {
    // List mode
    if (args.list) {
      console.log("\n─".padEnd(51, "─"));
      console.log("  ⚡ Crosspad Scripts");
      console.log("─".repeat(50));
      printScriptList();
      return;
    }

    // CLI mode: command provided
    if (args.command) {
      const selected = resolveScript(args.command);

      if (!selected) {
        console.log(`\n  ❌ Unknown command: ${args.command}`);
        console.log("  Run with --list to see all available scripts.\n");
        process.exit(1);
      }

      let env = args.env || "";

      if (selected.needsEnv && !env) {
        console.log(`\n  ❌ Script "${selected.name}" requires --env <dev|prod>\n`);
        process.exit(1);
      }

      runScript(selected, env);
      return;
    }

    // Interactive mode
    console.log("");
    console.log("─".repeat(50));
    console.log("  ⚡ Crosspad Scripts");
    console.log("─".repeat(50));
    printScriptList();

    const input = await ask("  Select command (number or name): ");
    const selected = resolveScript(input);

    if (!selected) {
      console.log("\n  ❌ Invalid selection\n");
      process.exit(1);
    }

    let env = "";
    if (selected.needsEnv) {
      env = await promptEnv(selected.name);
    }

    runScript(selected, env);
  },
});

runMain(main);
