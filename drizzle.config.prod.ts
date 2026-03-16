import process from "node:process";

import { createConfig } from "./drizzle.config.js";

export default createConfig({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  databaseId: process.env.CLOUDFLARE_DB_PROD_ID!,
  token: process.env.CLOUDFLARE_API_TOKEN!,
});
