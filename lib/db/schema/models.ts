import { subaruclub } from "./_namespace";
import { uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const models = subaruclub.table("models", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameFull: text("name_full").notNull(),
  taglineCs: text("tagline_cs"),
  descriptionCs: text("description_cs"),
  descriptionEnRaw: text("description_en_raw"),
  category: text("category").notNull(),
  productionStart: integer("production_start"),
  productionEnd: integer("production_end"),
  heroImageUrl: text("hero_image_url"),
  wikidataQid: text("wikidata_qid"),
  contentTier: text("content_tier").notNull().default("bronze"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
