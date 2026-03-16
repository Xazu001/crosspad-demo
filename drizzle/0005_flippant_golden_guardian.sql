ALTER TABLE `user_settings` ADD `is_2fa_enabled` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `idx_user_settings_2fa_enabled` ON `user_settings` (`is_2fa_enabled`);