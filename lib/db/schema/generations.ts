import { subaruclub } from "./_namespace";
import { models } from "./models";
import {
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const generations = subaruclub.table(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    code: text("code"),
    name: text("name").notNull(),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
    descriptionCs: text("description_cs"),
    descriptionEnRaw: text("description_en_raw"),
    heroImageUrl: text("hero_image_url"),
    chassisCodes: text("chassis_codes").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("generations_model_slug_unique").on(table.modelId, table.slug),
  ],
);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
