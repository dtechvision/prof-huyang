import { pgTable, bigint, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const casts = pgTable("casts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fid: bigint({ mode: "number" }).notNull(),
	hash: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	embeds: jsonb(),
	parentCastUrl: text("parent_cast_url"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentCastFid: bigint("parent_cast_fid", { mode: "number" }),
	parentCastHash: text("parent_cast_hash"),
	text: text(),
	mentions: integer(),
	mentionsPositions: integer("mentions_positions"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const links = pgTable("links", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fid: bigint({ mode: "number" }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	targetFid: bigint("target_fid", { mode: "number" }).notNull(),
	type: text().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const reactions = pgTable("reactions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fid: bigint({ mode: "number" }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	targetCastFid: bigint("target_cast_fid", { mode: "number" }).notNull(),
	targetCastHash: text("target_cast_hash").notNull(),
	type: text().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const profiles = pgTable("profiles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fid: bigint({ mode: "number" }).notNull(),
	data: jsonb(),
	custodyAddress: text("custody_address"),
	lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true, mode: 'string' }),
});

export const verifications = pgTable("verifications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fid: bigint({ mode: "number" }).notNull(),
	address: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});
