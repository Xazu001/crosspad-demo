import type { Tables } from "$/database/tables";
import type {
  AdminService,
  AuthService,
  BaseService,
  KitService,
  KitTransferService,
  UserService,
} from "$/services";

import type { Kysely } from "kysely";

export interface Services {
  base: BaseService; // Any service extending BaseService can be used
  admin: AdminService;
  auth: AuthService;
  user: UserService;
  kit: KitService;
  kitTransfer: KitTransferService;
  preferences: typeof import("../../shared/preferences");
}

declare module "hono" {
  interface ContextVariableMap {
    services: Services;
  }
}

export type Database = {
  op: Kysely<Tables>;
  cf: D1Database;
};
