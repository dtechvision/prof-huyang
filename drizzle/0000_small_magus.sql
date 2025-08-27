-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "casts" (
	"fid" bigint NOT NULL,
	"hash" text NOT NULL,
	"timestamp" timestamp with time zone,
	"embeds" jsonb[],
	"parent_cast_url" text,
	"parent_cast_fid" bigint,
	"parent_cast_hash" text,
	"text" text,
	"mentions" integer[],
	"mentions_positions" integer[],
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "links" (
	"fid" bigint NOT NULL,
	"timestamp" timestamp with time zone,
	"target_fid" bigint NOT NULL,
	"type" text NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"fid" bigint NOT NULL,
	"timestamp" timestamp with time zone,
	"target_cast_fid" bigint NOT NULL,
	"target_cast_hash" text NOT NULL,
	"type" text NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"fid" bigint NOT NULL,
	"data" jsonb,
	"custody_address" text,
	"last_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"fid" bigint NOT NULL,
	"address" text NOT NULL,
	"timestamp" timestamp with time zone,
	"deleted_at" timestamp with time zone
);

*/