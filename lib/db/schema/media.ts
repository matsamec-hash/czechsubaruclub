import { subaruclub } from "./_namespace";
import { uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const media = subaruclub.table("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  url: text("url").notNull(),
  altCs: text("alt_cs"),
  credit: text("credit"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
