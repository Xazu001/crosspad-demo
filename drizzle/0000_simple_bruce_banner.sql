CREATE TABLE `categories` (
	`category_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL,
	`category_description` text NOT NULL,
	`category_created_on` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_category_name_unique` ON `categories` (`category_name`);--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`group_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_name` text NOT NULL,
	`group_description` text NOT NULL,
	`group_created_on` integer NOT NULL,
	`group_logo` text,
	`group_owner_id` text NOT NULL,
	`group_public` integer DEFAULT false NOT NULL,
	`group_status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`group_owner_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kit_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kit_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`kit_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kits` (
	`kit_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kit_name` text NOT NULL,
	`kit_description` text NOT NULL,
	`kit_colors` text,
	`user_id` text,
	`group_id` integer,
	`kit_created_on` integer NOT NULL,
	`kit_published_on` integer,
	`kit_logo_source` text,
	`kit_metronome` integer DEFAULT 120,
	`kit_status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `logins` (
	`login_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`login_email` text NOT NULL,
	`login_password` text NOT NULL,
	`login_created_on` integer NOT NULL,
	`login_verification_code` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logins_login_email_unique` ON `logins` (`login_email`);--> statement-breakpoint
CREATE TABLE `pad_samples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pad_id` integer NOT NULL,
	`sample_id` integer NOT NULL,
	`playback_order` integer DEFAULT 0,
	FOREIGN KEY (`pad_id`) REFERENCES `pads`(`pad_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sample_id`) REFERENCES `samples`(`sample_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pads` (
	`pad_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pad_name` text NOT NULL,
	`pad_kit_id` integer NOT NULL,
	`pad_position` integer NOT NULL,
	`pad_choke_group` integer,
	`pad_play_mode` text NOT NULL,
	FOREIGN KEY (`pad_kit_id`) REFERENCES `kits`(`kit_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `samples` (
	`sample_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sample_name` text NOT NULL,
	`sample_description` text,
	`user_id` text,
	`group_id` integer,
	`sample_created_on` integer NOT NULL,
	`sample_source` text NOT NULL,
	`sample_recent_created` integer,
	`sample_status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_rights` (
	`user_right_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`user_create_kit` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_setting_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`user_name` text NOT NULL,
	`user_namespace` text NOT NULL,
	`user_avatar_source` text,
	`user_verified` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_namespace_unique` ON `users` (`user_namespace`);--> statement-breakpoint
CREATE VIEW `published_kits` AS select "kit_id", "kit_name", "kit_description", "kit_colors", "user_id", "group_id", "kit_created_on", "kit_published_on", "kit_logo_source", "kit_metronome", "kit_status" from "kits" where "kits"."kit_status" = 'published';--> statement-breakpoint
CREATE VIEW `verified_users` AS select "user_id", "user_name", "user_namespace", "user_avatar_source", "user_verified" from "users" where "users"."user_verified" = 1;