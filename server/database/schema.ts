// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import {
  CONTENT_STATUS_VALUES,
  type ContentStatusType,
  GROUP_ROLE_VALUES,
  GROUP_STATUS_VALUES,
  type GroupRoleType,
  type GroupStatusType,
  PAD_PLAY_MODE_VALUES,
  type PadPlayModeType,
  USER_STATUS_VALUES,
  type UserStatusType,
} from "@/enums";

import { eq } from "drizzle-orm";
import { index, integer, sqliteTable, sqliteView, text } from "drizzle-orm/sqlite-core";

// ──────────────────────────────────────────────────────────────
// Database Schema Definition
// ──────────────────────────────────────────────────────────────
// This file defines all database tables and views for the Crosspad application.
// Uses Drizzle ORM with SQLite for Cloudflare D1 compatibility.

/**
 * Users table - Core user accounts and profiles
 *
 * Stores user authentication and profile information. Each user has a unique
 * namespace for URL-friendly identifiers and optional avatar.
 */
export const users = sqliteTable(
  "users",
  {
    user_id: text("user_id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()), // UUID for unique identification
    user_name: text("user_name").notNull(), // Display name for the user
    user_namespace: text("user_namespace").unique().notNull(), // URL-friendly unique identifier
    user_avatar_source: text("user_avatar_source"), // Path to avatar image file
    user_verified: integer("user_verified", { mode: "boolean" }).notNull(), // Email verification status
    user_status: text("user_status", { enum: USER_STATUS_VALUES })
      .$type<UserStatusType>()
      .notNull()
      .default("active"), // User account status
    anonymization_requested_at: integer("anonymization_requested_at"), // When anonymization was requested
    anonymization_undo_code: text("anonymization_undo_code"), // Code to undo anonymization
  },
  (table) => ({
    // Index for user lookup by verification status
    verifiedIdx: index("idx_users_verified").on(table.user_verified),
    // Index for user search by name
    nameIdx: index("idx_users_name").on(table.user_name),
    // Index for user status filtering
    statusIdx: index("idx_users_status").on(table.user_status),
    // Index for anonymization cleanup
    anonymizationRequestedIdx: index("idx_users_anonymization_requested").on(
      table.anonymization_requested_at,
    ),
  }),
);

/**
 * User settings table - Per-user configuration preferences
 *
 * Stores user-specific settings and preferences. Extends user accounts
 * with configurable options.
 */
export const user_settings = sqliteTable(
  "user_settings",
  {
    user_setting_id: integer("user_setting_id").primaryKey({
      autoIncrement: true,
    }),
    user_id: text("user_id")
      .notNull()
      .unique()
      .references(() => users.user_id), // Foreign key to users table
    user_totp_enabled: integer("user_totp_enabled", {
      mode: "boolean",
    }).default(false), // TOTP/2FA enabled flag
  },
  (table) => ({
    // Index for fast user settings lookup
    userIdIdx: index("idx_user_settings_user_id").on(table.user_id),
    // Index for TOTP enabled users
    totpEnabledIdx: index("idx_user_settings_totp_enabled").on(table.user_totp_enabled),
  }),
);

/**
 * User rights table - Permission system for user capabilities
 *
 * Controls what actions users can perform, such as creating kits.
 * Implements a role-based permission system.
 */
export const user_rights = sqliteTable(
  "user_rights",
  {
    user_right_id: integer("user_right_id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.user_id), // Foreign key to users table
    user_admin: integer("user_admin", { mode: "boolean" }).default(false), // Admin privileges
    user_create_kit: integer("user_create_kit", { mode: "boolean" }).default(false), // Permission to create kits
  },
  (table) => ({
    // Index for fast user rights lookup
    userIdIdx: index("idx_user_rights_user_id").on(table.user_id),
  }),
);

/**
 * Verified users view - Pre-filtered view of verified users only
 *
 * Database view that automatically filters to only include verified users.
 * Improves query performance for user lookup operations.
 */
export const verified_users = sqliteView("verified_users").as((qb) => {
  return qb.select().from(users).where(eq(users.user_verified, true));
});

/**
 * Logins table - User authentication credentials
 *
 * Stores email/password combinations for user authentication.
 * Separate from users table to support multiple login methods.
 */
export const logins = sqliteTable(
  "logins",
  {
    login_id: integer("login_id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").references(() => users.user_id), // Link to user account
    login_email: text("login_email").unique(), // Unique email for login (nullable for anonymized users)
    login_password: text("login_password"), // Hashed password (nullable for anonymized users)
    login_created_on: integer("login_created_on").$defaultFn(() => Date.now()), // Timestamp for account creation
    login_verification_code: text("login_verification_code"), // Email verification token
  },
  (table) => ({
    // Index for fast user login lookup
    userIdIdx: index("idx_logins_user_id").on(table.user_id),
    // Index for verification code lookup
    verificationCodeIdx: index("idx_logins_verification_code").on(table.login_verification_code),
  }),
);

/**
 * Groups table - User communities and organizations
 *
 * Supports collaborative features where users can create and join groups.
 * Groups can be public or private with different access levels.
 */
export const groups = sqliteTable(
  "groups",
  {
    group_id: integer("group_id").primaryKey({ autoIncrement: true }),
    group_name: text("group_name").notNull(), // Display name for the group
    group_description: text("group_description").notNull(), // Group purpose/description
    group_created_on: integer("group_created_on")
      .notNull()
      .$defaultFn(() => Date.now()), // Creation timestamp
    group_logo: text("group_logo"), // Path to group logo image
    group_owner_id: text("group_owner_id")
      .notNull()
      .references(() => users.user_id), // Group creator/owner
    group_public: integer("group_public", { mode: "boolean" }).default(false).notNull(), // Visibility setting - public vs private
    group_status: text("group_status", { enum: GROUP_STATUS_VALUES })
      .$type<GroupStatusType>()
      .notNull()
      .default("active"), // Group status (active, inactive, etc.)
    deletion_requested_at: integer("deletion_requested_at"), // When deletion was requested
  },
  (table) => ({
    // Index for group lookup by owner
    ownerIdIdx: index("idx_groups_owner_id").on(table.group_owner_id),
    // Index for public groups filtering
    publicIdx: index("idx_groups_public").on(table.group_public),
    // Index for group status filtering
    statusIdx: index("idx_groups_status").on(table.group_status),
    // Index for deletion cleanup
    deletionRequestedIdx: index("idx_groups_deletion_requested").on(table.deletion_requested_at),
    // Composite index for public active groups
    publicStatusIdx: index("idx_groups_public_status").on(table.group_public, table.group_status),
  }),
);

/**
 * Group members table - Many-to-many relationship between users and groups
 *
 * Manages group membership with role-based permissions.
 * Supports different member roles like owner, admin, member.
 */
export const group_members = sqliteTable(
  "group_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    group_id: integer("group_id")
      .notNull()
      .references(() => groups.group_id), // Foreign key to groups
    user_id: text("user_id")
      .notNull()
      .references(() => users.user_id), // Foreign key to users
    role: text("role", { enum: GROUP_ROLE_VALUES })
      .$type<GroupRoleType>()
      .notNull()
      .default("member"), // Member role (owner, admin, member)
    joined_at: integer("joined_at")
      .notNull()
      .$defaultFn(() => Date.now()), // When user joined the group
  },
  (table) => ({
    // Index for finding user's groups
    userIdIdx: index("idx_group_members_user_id").on(table.user_id),
    // Index for finding group members
    groupIdIdx: index("idx_group_members_group_id").on(table.group_id),
    // Composite index for user-group lookup
    userGroupIdx: index("idx_group_members_user_group").on(table.user_id, table.group_id),
    // Index for finding members by role
    roleIdx: index("idx_group_members_role").on(table.role),
  }),
);

/**
 * Samples table - Audio files and sound assets
 *
 * Stores metadata for audio samples uploaded by users.
 * Samples can be used across multiple kits and pads.
 */
export const samples = sqliteTable(
  "samples",
  {
    sample_id: integer("sample_id").primaryKey({ autoIncrement: true }),
    sample_name: text("sample_name").notNull(), // Display name for the sample
    sample_description: text("sample_description"), // Optional description
    user_id: text("user_id").references(() => users.user_id), // Sample creator
    group_id: integer("group_id").references(() => groups.group_id), // Group ownership (optional)
    sample_created_on: integer("sample_created_on")
      .notNull()
      .$defaultFn(() => Date.now()), // Creation timestamp
    sample_source: text("sample_source").notNull(), // File path or URL to audio file
    sample_recent_created: integer("sample_recent_created", {
      mode: "boolean",
    }), // Flag for recent uploads
    sample_status: text("sample_status", { enum: CONTENT_STATUS_VALUES })
      .$type<ContentStatusType>()
      .notNull()
      .default("draft"), // Publication status (draft, published, etc.)
    deletion_requested_at: integer("deletion_requested_at"), // When deletion was requested
  },
  (table) => ({
    // Index for finding samples by creator
    userIdIdx: index("idx_samples_user_id").on(table.user_id),
    // Index for finding samples by group
    groupIdIdx: index("idx_samples_group_id").on(table.group_id),
    // Index for sorting by creation date
    createdOnIdx: index("idx_samples_created_on").on(table.sample_created_on),
    // Index for finding recent samples
    recentCreatedIdx: index("idx_samples_recent_created").on(table.sample_recent_created),
    // Index for filtering by status
    statusIdx: index("idx_samples_status").on(table.sample_status),
    // Index for deletion cleanup
    deletionRequestedIdx: index("idx_samples_deletion_requested").on(table.deletion_requested_at),
    // Composite index for published samples by date
    statusCreatedIdx: index("idx_samples_status_created").on(
      table.sample_status,
      table.sample_created_on,
    ),
  }),
);

/**
 * Kits table - Drum kits and sound collections
 *
 * Represents complete drum kits containing multiple pads with samples.
 * Kits can be created by users or groups and have customizable colors.
 */
export const kits = sqliteTable(
  "kits",
  {
    kit_id: integer("kit_id").primaryKey({ autoIncrement: true }),
    kit_name: text("kit_name").notNull(), // Display name for the kit
    kit_description: text("kit_description").notNull(), // Kit description and purpose
    kit_colors: text("kit_colors").$type<string>(), // JSON string of KitColors
    user_id: text("user_id").references(() => users.user_id), // Kit creator (optional)
    group_id: integer("group_id").references(() => groups.group_id), // Group ownership (optional)
    kit_created_on: integer("kit_created_on")
      .notNull()
      .$defaultFn(() => Date.now()), // Creation timestamp
    kit_published_on: integer("kit_published_on"), // Publication timestamp (null until published)
    kit_logo_source: text("kit_logo_source"), // Path to kit logo image
    kit_metronome: integer("kit_metronome").default(120), // Default BPM for metronome
    kit_status: text("kit_status", { enum: CONTENT_STATUS_VALUES })
      .$type<ContentStatusType>()
      .notNull()
      .default("draft"), // Publication status (draft, published, etc.)
    deletion_requested_at: integer("deletion_requested_at"), // When deletion was requested
  },
  (table) => ({
    // Index for finding kits by creator
    userIdIdx: index("idx_kits_user_id").on(table.user_id),
    // Index for finding kits by group
    groupIdIdx: index("idx_kits_group_id").on(table.group_id),
    // Index for sorting by creation date (most common query)
    createdOnIdx: index("idx_kits_created_on").on(table.kit_created_on),
    // Index for sorting by publication date
    publishedOnIdx: index("idx_kits_published_on").on(table.kit_published_on),
    // Index for filtering by status
    statusIdx: index("idx_kits_status").on(table.kit_status),
    // Index for deletion cleanup
    deletionRequestedIdx: index("idx_kits_deletion_requested").on(table.deletion_requested_at),
    // Composite index for published kits by date (for browsing)
    statusCreatedIdx: index("idx_kits_status_created").on(table.kit_status, table.kit_created_on),
    // Composite index for finding user's published kits
    userStatusIdx: index("idx_kits_user_status").on(table.user_id, table.kit_status),
  }),
);

/**
 * Published kits view - Pre-filtered view of published kits only
 *
 * Database view that automatically filters to only include published kits.
 * Improves query performance for public kit browsing.
 */
export const published_kits = sqliteView("published_kits").as((qb) => {
  return qb.select().from(kits).where(eq(kits.kit_status, "published"));
});

/**
 * Pads table - Individual drum pads within kits
 *
 * Represents individual trigger pads in a drum kit. Each pad has a position
 * in the UI and can contain multiple samples with different play modes.
 */
export const pads = sqliteTable(
  "pads",
  {
    pad_id: integer("pad_id").primaryKey({ autoIncrement: true }),
    pad_name: text("pad_name").notNull(), // Display name (P13, P14, P15, P16 based on UI position)
    pad_kit_id: integer("pad_kit_id")
      .notNull()
      .references(() => kits.kit_id), // Parent kit
    pad_position: integer("pad_position").notNull(), // Position in UI (0-15)
    pad_choke_group: integer("pad_choke_group"), // MIDI choke group for muting other pads
    pad_play_mode: text("pad_play_mode", { enum: PAD_PLAY_MODE_VALUES })
      .$type<PadPlayModeType>()
      .notNull(), // How pad triggers (tap, hold, etc.)
  },
  (table) => ({
    // Index for finding pads by kit (most common query)
    kitIdIdx: index("idx_pads_kit_id").on(table.pad_kit_id),
    // Composite index for kit pads in correct order
    kitPositionIdx: index("idx_pads_kit_position").on(table.pad_kit_id, table.pad_position),
    // Index for finding pads by choke group
    chokeGroupIdx: index("idx_pads_choke_group").on(table.pad_choke_group),
  }),
);

/**
 * Pad samples junction table - Many-to-many relationship between pads and samples
 *
 * Links samples to pads with playback order. Supports multiple samples per pad
 * for round-robin or random playback modes.
 */
export const pad_samples = sqliteTable(
  "pad_samples",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pad_id: integer("pad_id")
      .notNull()
      .references(() => pads.pad_id), // Foreign key to pads
    sample_id: integer("sample_id")
      .notNull()
      .references(() => samples.sample_id), // Foreign key to samples
    playback_order: integer("playback_order").default(0), // Order for multi-sample playback
  },
  (table) => ({
    // Index for finding samples by pad
    padIdIdx: index("idx_pad_samples_pad_id").on(table.pad_id),
    // Index for finding pads by sample
    sampleIdIdx: index("idx_pad_samples_sample_id").on(table.sample_id),
    // Composite index for ordered pad samples
    padOrderIdx: index("idx_pad_samples_pad_order").on(table.pad_id, table.playback_order),
  }),
);

/**
 * Categories table - Kit categorization and tagging
 *
 * Defines available categories for organizing and browsing kits.
 * Categories like "Hip Hop", "Electronic", "Rock", etc.
 */
export const categories = sqliteTable("categories", {
  category_id: integer("category_id").primaryKey({ autoIncrement: true }),
  category_name: text("category_name").unique().notNull(), // Unique category name
  category_description: text("category_description").notNull(), // Category purpose/description
  category_created_on: integer("category_created_on")
    .notNull()
    .$defaultFn(() => Date.now()), // Creation timestamp
});

/**
 * Kit categories junction table - Many-to-many relationship between kits and categories
 *
 * Links kits to categories for categorization and browsing.
 * Supports multiple categories per kit.
 */
export const kit_categories = sqliteTable(
  "kit_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kit_id: integer("kit_id")
      .notNull()
      .references(() => kits.kit_id, { onDelete: "cascade" }), // Auto-delete when kit deleted
    category_id: integer("category_id")
      .notNull()
      .references(() => categories.category_id, { onDelete: "cascade" }), // Auto-delete when category deleted
  },
  (table) => ({
    // Index for finding categories by kit
    kitIdIdx: index("idx_kit_categories_kit_id").on(table.kit_id),
    // Index for finding kits by category (for category browsing)
    categoryIdIdx: index("idx_kit_categories_category_id").on(table.category_id),
    // Composite index for preventing duplicates and fast lookups
    kitCategoryIdx: index("idx_kit_categories_kit_category").on(table.kit_id, table.category_id),
  }),
);

// Re-export KitColors from shared for backward compatibility
export type { KitColors } from "@/constants/kit";
