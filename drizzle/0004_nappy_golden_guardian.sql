ALTER TABLE `groups` ADD `deletion_requested_at` integer;--> statement-breakpoint
CREATE INDEX `idx_groups_deletion_requested` ON `groups` (`deletion_requested_at`);--> statement-breakpoint
ALTER TABLE `kits` ADD `deletion_requested_at` integer;--> statement-breakpoint
CREATE INDEX `idx_kits_deletion_requested` ON `kits` (`deletion_requested_at`);--> statement-breakpoint
ALTER TABLE `samples` ADD `deletion_requested_at` integer;--> statement-breakpoint
CREATE INDEX `idx_samples_deletion_requested` ON `samples` (`deletion_requested_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `user_totp_enabled` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `idx_users_totp_enabled` ON `users` (`user_totp_enabled`);--> statement-breakpoint
DROP VIEW `published_kits`;--> statement-breakpoint
DROP VIEW `verified_users`;--> statement-breakpoint
CREATE VIEW `published_kits` AS select "kit_id", "kit_name", "kit_description", "kit_colors", "user_id", "group_id", "kit_created_on", "kit_published_on", "kit_logo_source", "kit_metronome", "kit_status", "deletion_requested_at" from "kits" where "kits"."kit_status" = 'published';--> statement-breakpoint
CREATE VIEW `verified_users` AS select "user_id", "user_name", "user_namespace", "user_avatar_source", "user_verified", "user_status", "anonymization_requested_at", "anonymization_undo_code", "user_totp_enabled" from "users" where "users"."user_verified" = 1;