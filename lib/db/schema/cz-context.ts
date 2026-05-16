import { subaruclub } from "./_namespace";
import { models } from "./models";
import { generations } from "./generations";
import { uuid, text, timestamp } from "drizzle-orm/pg-core";

export const czContext = subaruclub.table("cz_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").references(() => models.id, {
    onDelete: "cascade",
  }),
  generationId: uuid("generation_id").references(() => generations.id, {
    onDelete: "cascade",
  }),
  topic: text("topic").notNull(),
  contentCs: text("content_cs").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CzContext = typeof czContext.$inferSelect;
export type NewCzContext = typeof czContext.$inferInsert;
