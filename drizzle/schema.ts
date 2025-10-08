import { pgTable, text, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const links = pgTable("links", {
	fid: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	signer: text(),
	targetFid: text("target_fid").notNull(),
	type: text().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const reactions = pgTable("reactions", {
	fid: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	signer: text(),
	targetCastFid: text("target_cast_fid").notNull(),
	targetCastHash: text("target_cast_hash").notNull(),
	type: text().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const profiles = pgTable("profiles", {
	fid: text().notNull(),
	data: jsonb(),
	custodyAddress: text("custody_address"),
	signer: text(),
	lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true, mode: 'string' }),
});

export const casts = pgTable("casts", {
	fid: text().notNull(),
	hash: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	signer: text(),
	embeds: jsonb(),
	parentCastUrl: text("parent_cast_url"),
	parentCastFid: text("parent_cast_fid"),
	parentCastHash: text("parent_cast_hash"),
	text: text(),
	mentions: text(),
	mentionsPositions: integer("mentions_positions"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("casts_fid_timestamp_idx").using("btree", table.fid.asc().nullsLast().op("text_ops"), table.timestamp.desc().nullsFirst().op("text_ops")),
]);

export const verifications = pgTable("verifications", {
	fid: text().notNull(),
	address: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	signer: text(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});
