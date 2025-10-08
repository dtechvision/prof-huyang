-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "links" (
	"fid" text NOT NULL,
	"timestamp" timestamp with time zone,
	"signer" text,
	"target_fid" text NOT NULL,
	"type" text NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"fid" text NOT NULL,
	"timestamp" timestamp with time zone,
	"signer" text,
	"target_cast_fid" text NOT NULL,
	"target_cast_hash" text NOT NULL,
	"type" text NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"fid" text NOT NULL,
	"data" jsonb,
	"custody_address" text,
	"signer" text,
	"last_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "casts" (
	"fid" text NOT NULL,
	"hash" text NOT NULL,
	"timestamp" timestamp with time zone,
	"signer" text,
	"embeds" jsonb[],
	"parent_cast_url" text,
	"parent_cast_fid" text,
	"parent_cast_hash" text,
	"text" text,
	"mentions" text[],
	"mentions_positions" integer[],
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"fid" text NOT NULL,
	"address" text NOT NULL,
	"timestamp" timestamp with time zone,
	"signer" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "casts_fid_timestamp_idx" ON "casts" USING btree ("fid" text_ops,"timestamp" text_ops);
*/