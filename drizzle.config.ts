import { defineConfig } from "drizzle-kit";

const baseConfig = {
  out: "./drizzle",
  schema: "./server/database/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
} as const;

type D1Credentials = {
  accountId: string;
  databaseId: string;
  token: string;
};

export const createConfig = (dbCredentials: D1Credentials) =>
  defineConfig({ ...baseConfig, dbCredentials });

export default defineConfig(baseConfig);
