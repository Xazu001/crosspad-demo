// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import type * as schema from "$/database/schema";

import type { Kyselify } from "drizzle-orm/kysely";

import type { ColumnType, Selectable } from "kysely";

// ──────────────────────────────────────────────────────────────
// SQLite Boolean Type Utility
// ──────────────────────────────────────────────────────────────

/**
 * SQLite boolean column type for Kysely.
 *
 * SQLite stores booleans as integers (0/1) at runtime, but Drizzle
 * defines them as `integer("col", { mode: "boolean" })` which TypeScript
 * sees as `boolean`. This type correctly maps:
 * - SelectType: `number` (what SQLite actually returns)
 * - InsertType: `boolean | number | null` (flexible input)
 * - UpdateType: same as InsertType
 */
export type SQLiteBoolean = ColumnType<number, boolean | number | null, boolean | number | null>;

/**
 * Helper to replace boolean column types with SQLiteBoolean in a table type.
 * Kyselify wraps booleans in ColumnType<boolean, ...>, so we check the SelectType.
 */
export type WithSQLiteBooleans<T> = {
  [K in keyof T]: T[K] extends ColumnType<infer S, infer I, infer U>
    ? S extends boolean
      ? ColumnType<number, I, U>
      : T[K]
    : T[K];
};

// ──────────────────────────────────────────────────────────────
// Database Type Definitions
// ──────────────────────────────────────────────────────────────

/**
 * Kysely-compatible table types for the Crosspad database.
 *
 * Converts Drizzle schema types to Kysely-compatible types for use
 * with the Kysely query builder. Uses WithSQLiteBooleans to properly
 * handle SQLite's integer-based boolean storage.
 */
export type Tables = {
  users: WithSQLiteBooleans<Kyselify<typeof schema.users>>;
  user_settings: WithSQLiteBooleans<Kyselify<typeof schema.user_settings>>;
  user_rights: WithSQLiteBooleans<Kyselify<typeof schema.user_rights>>;
  logins: Kyselify<typeof schema.logins>;
  groups: WithSQLiteBooleans<Kyselify<typeof schema.groups>>;
  group_members: Kyselify<typeof schema.group_members>;
  samples: WithSQLiteBooleans<Kyselify<typeof schema.samples>>;
  kits: Kyselify<typeof schema.kits>;
  pads: Kyselify<typeof schema.pads>;
  pad_samples: Kyselify<typeof schema.pad_samples>;
  categories: Kyselify<typeof schema.categories>;
  kit_categories: Kyselify<typeof schema.kit_categories>;
  // Views - manually defined since Kyselify only works with tables
  verified_users: WithSQLiteBooleans<Kyselify<typeof schema.users>>;
  published_kits: Kyselify<typeof schema.kits>;
};

// ──────────────────────────────────────────────────────────────
// Entity Types
// ──────────────────────────────────────────────────────────────

/**
 * Selectable entity types for database records.
 *
 * These types represent the shape of data when retrieved from the database.
 * They exclude auto-incrementing IDs and default values that are set by the database.
 */

// User management types
export type User = Selectable<Tables["users"]>;
export type UserSetting = Selectable<Tables["user_settings"]>;
export type UserRight = Selectable<Tables["user_rights"]>;
export type Login = Selectable<Tables["logins"]>;

// Group management types
export type Group = Selectable<Tables["groups"]>;
export type GroupMember = Selectable<Tables["group_members"]>;

// Content management types
export type Sample = Selectable<Tables["samples"]>;
export type Kit = Selectable<Tables["kits"]>;
export type Pad = Selectable<Tables["pads"]>;
export type PadSample = Selectable<Tables["pad_samples"]>;

// Category management types
export type Category = Selectable<Tables["categories"]>;
export type KitCategory = Selectable<Tables["kit_categories"]>;
