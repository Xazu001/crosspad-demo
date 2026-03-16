import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ScriptEnv = "dev" | "prod";

export interface ScriptConfig {
  env: ScriptEnv;
  db: { name: string; remote: boolean };
  r2: { bucket: string; remote: boolean };
  cloudflare: { accountId: string; apiToken: string };
  api: { privKey: string };
  paths: { scripts: string; root: string };
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} not found in environment variables`);
  return value;
}

function getScriptEnv(): ScriptEnv {
  return process.env.SCRIPT_ENV === "prod" ? "prod" : "dev";
}

const ENV_CONFIG = {
  dev: { dbName: "crosspad-x-dev", r2Bucket: "crosspad-x-dev" },
  prod: { dbName: "crosspad-x", r2Bucket: "crosspad-x" },
} as const;

export function createConfig(options?: {
  env?: ScriptEnv;
  dbRemote?: boolean;
  r2Remote?: boolean;
}): ScriptConfig {
  const env = options?.env ?? getScriptEnv();
  const res = ENV_CONFIG[env];

  return {
    env,
    db: { name: res.dbName, remote: options?.dbRemote ?? true },
    r2: { bucket: res.r2Bucket, remote: options?.r2Remote ?? true },
    cloudflare: {
      accountId: getEnvOrThrow("CLOUDFLARE_ACCOUNT_ID"),
      apiToken: getEnvOrThrow("CLOUDFLARE_API_TOKEN"),
    },
    api: { privKey: getEnvOrThrow("PRIV_API_KEY") },
    paths: {
      scripts: path.join(__dirname, ".."),
      root: path.join(__dirname, "..", ".."),
    },
  };
}

export const config: ScriptConfig = createConfig();

export default config;
