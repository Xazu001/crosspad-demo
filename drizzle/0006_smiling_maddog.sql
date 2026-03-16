ALTER TABLE `user_settings` RENAME COLUMN "is_2fa_enabled" TO "user_totp_enabled";--> statement-breakpoint
DROP INDEX `idx_user_settings_2fa_enabled`;--> statement-breakpoint
CREATE INDEX `idx_user_settings_totp_enabled` ON `user_settings` (`user_totp_enabled`);--> statement-breakpoint
DROP INDEX `idx_users_totp_enabled`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `user_totp_enabled`;--> statement-breakpoint
DROP VIEW `verified_users`;--> statement-breakpoint
CREATE VIEW `verified_users` AS select "user_id", "user_name", "user_namespace", "user_avatar_source", "user_verified", "user_status", "anonymization_requested_at", "anonymization_undo_code" from "users" where "users"."user_verified" = 1;