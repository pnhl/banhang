CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`seller_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "app_users_role_check" CHECK("app_users"."role" IN ('customer', 'seller', 'admin')),
	CONSTRAINT "app_users_status_check" CHECK("app_users"."status" IN ('active', 'suspended'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_users_email_unique` ON `app_users` (`email`);--> statement-breakpoint
CREATE INDEX `app_users_role_status_idx` ON `app_users` (`role`,`status`);--> statement-breakpoint
CREATE INDEX `app_users_seller_idx` ON `app_users` (`seller_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`ip_hash` text,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`sold` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "inventory_non_negative_check" CHECK("inventory"."available" >= 0 AND "inventory"."reserved" >= 0 AND "inventory"."sold" >= 0)
);
--> statement-breakpoint
CREATE INDEX `inventory_seller_idx` ON `inventory` (`seller_id`);--> statement-breakpoint
CREATE INDEX `inventory_available_idx` ON `inventory` (`available`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`seller_id` text,
	`r2_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`alt_text` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "media_assets_size_check" CHECK("media_assets"."byte_size" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_r2_key_unique` ON `media_assets` (`r2_key`);--> statement-breakpoint
CREATE INDEX `media_assets_owner_idx` ON `media_assets` (`owner_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `media_assets_seller_idx` ON `media_assets` (`seller_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`action_url` text,
	`read_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`seller_id` text NOT NULL,
	`name` text NOT NULL,
	`variant` text,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "order_items_quantity_price_check" CHECK("order_items"."quantity" > 0 AND "order_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_seller_idx` ON `order_items` (`seller_id`,`order_id`);--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`order_code` integer NOT NULL,
	`order_id` text NOT NULL,
	`user_email` text NOT NULL,
	`provider` text DEFAULT 'payos' NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'CREATING' NOT NULL,
	`payment_link_id` text,
	`checkout_url` text,
	`qr_code` text,
	`provider_reference` text,
	`expires_at` text,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "payment_intents_amount_check" CHECK("payment_intents"."amount" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intents_order_code_unique` ON `payment_intents` (`order_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intents_order_id_unique` ON `payment_intents` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_intents_user_status_idx` ON `payment_intents` (`user_email`,`status`);--> statement-breakpoint
CREATE TABLE `platform_products` (
	`id` integer PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`sold_count` integer DEFAULT 0 NOT NULL,
	`delivery_days` integer DEFAULT 3 NOT NULL,
	`image_url` text NOT NULL,
	`badge` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "platform_products_price_check" CHECK("platform_products"."price" >= 0 AND "platform_products"."old_price" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_products_slug_unique` ON `platform_products` (`slug`);--> statement-breakpoint
CREATE INDEX `platform_products_category_status_idx` ON `platform_products` (`category`,`status`);--> statement-breakpoint
CREATE INDEX `platform_products_seller_status_idx` ON `platform_products` (`seller_id`,`status`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`reset_at` text NOT NULL,
	CONSTRAINT "rate_limits_count_check" CHECK("rate_limits"."count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `rate_limits_reset_idx` ON `rate_limits` (`reset_at`);--> statement-breakpoint
CREATE TABLE `return_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`requester_user_id` text NOT NULL,
	`seller_id` text,
	`reason` text NOT NULL,
	`details` text NOT NULL,
	`evidence_media_id` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`resolution` text,
	`refund_amount` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "return_requests_refund_check" CHECK("return_requests"."refund_amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX `return_requests_order_idx` ON `return_requests` (`order_id`);--> statement-breakpoint
CREATE INDEX `return_requests_seller_status_idx` ON `return_requests` (`seller_id`,`status`);--> statement-breakpoint
CREATE TABLE `seller_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`shop_name` text NOT NULL,
	`business_type` text NOT NULL,
	`tax_code` text,
	`phone` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`reviewer_note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seller_applications_user_unique` ON `seller_applications` (`user_id`);--> statement-breakpoint
CREATE INDEX `seller_applications_status_idx` ON `seller_applications` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`seller_id` text,
	`carrier` text DEFAULT 'LOPA Express' NOT NULL,
	`tracking_code` text NOT NULL,
	`status` text DEFAULT 'Chờ thanh toán' NOT NULL,
	`estimated_delivery` text,
	`shipping_address` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_order_unique` ON `shipments` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_tracking_code_unique` ON `shipments` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `shipments_seller_status_idx` ON `shipments` (`seller_id`,`status`);--> statement-breakpoint
CREATE TABLE `shipping_events` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`status` text NOT NULL,
	`location` text,
	`note` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shipping_events_shipment_idx` ON `shipping_events` (`shipment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Mặc định' NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`province_code` integer,
	`province` text NOT NULL,
	`ward_code` integer,
	`ward` text NOT NULL,
	`address_detail` text NOT NULL,
	`is_default` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_addresses_user_idx` ON `user_addresses` (`user_id`,`is_default`);