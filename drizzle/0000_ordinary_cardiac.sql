CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text NOT NULL,
	`session_id` text NOT NULL,
	`user_key` text,
	`order_id` text,
	`seller_id` text,
	`value` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_name_created_idx` ON `analytics_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_session_idx` ON `analytics_events` (`session_id`);--> statement-breakpoint
CREATE TABLE `commerce_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`subtotal` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`shipping` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`voucher_code` text,
	`invoice_number` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `commerce_orders_created_at_idx` ON `commerce_orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `commerce_orders_customer_email_idx` ON `commerce_orders` (`customer_email`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`number` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`seller_id` text,
	`subtotal` integer NOT NULL,
	`tax` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoices_order_idx` ON `invoices` (`order_id`);--> statement-breakpoint
CREATE INDEX `invoices_seller_idx` ON `invoices` (`seller_id`);--> statement-breakpoint
CREATE TABLE `seller_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`gross` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`commission` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`net` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `seller_ledger_seller_status_idx` ON `seller_ledger` (`seller_id`,`status`);--> statement-breakpoint
CREATE INDEX `seller_ledger_order_idx` ON `seller_ledger` (`order_id`);--> statement-breakpoint
CREATE TABLE `seller_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`amount` integer NOT NULL,
	`order_count` integer NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `seller_settlements_seller_idx` ON `seller_settlements` (`seller_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `voucher_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`order_id` text NOT NULL,
	`customer_key` text NOT NULL,
	`seller_id` text,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voucher_redemptions_code_idx` ON `voucher_redemptions` (`code`);--> statement-breakpoint
CREATE INDEX `voucher_redemptions_customer_idx` ON `voucher_redemptions` (`code`,`customer_key`);