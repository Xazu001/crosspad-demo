PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_logins` (
	`login_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`login_email` text,
	`login_password` text,
	`login_created_on` integer,
	`login_verification_code` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_logins`("login_id", "user_id", "login_email", "login_password", "login_created_on", "login_verification_code") SELECT "login_id", "user_id", "login_email", "login_password", "login_created_on", "login_verification_code" FROM `logins`;--> statement-breakpoint
DROP TABLE `logins`;--> statement-breakpoint
ALTER TABLE `__new_logins` RENAME TO `logins`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `logins_login_email_unique` ON `logins` (`login_email`);--> statement-breakpoint
CREATE INDEX `idx_logins_user_id` ON `logins` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_logins_verification_code` ON `logins` (`login_verification_code`);--> statement-breakpoint
ALTER TABLE `users` ADD `user_status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `anonymization_requested_at` integer;--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`user_status`);--> statement-breakpoint
CREATE INDEX `idx_users_anonymization_requested` ON `users` (`anonymization_requested_at`);--> statement-breakpoint
DROP VIEW `verified_users`;--> statement-breakpoint
CREATE VIEW `verified_users` AS select "user_id", "user_name", "user_namespace", "user_avatar_source", "user_verified", "user_status", "anonymization_requested_at" from "users" where "users"."user_verified" = 1;