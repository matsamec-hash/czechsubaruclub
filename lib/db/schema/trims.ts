import { subaruclub } from "./_namespace";
import { generations } from "./generations";
import {
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const trims = subaruclub.table("trims", {
  id: uuid("id").primaryKey().defaultRandom(),
  generationId: uuid("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  engineCode: text("engine_code"),
  engineDisplacementCc: integer("engine_displacement_cc"),
  powerHp: integer("power_hp"),
  torqueNm: integer("torque_nm"),
  drivetrain: text("drivetrain"),
  transmission: text("transmission"),
  topSpeedKmh: integer("top_speed_kmh"),
  zeroToHundredS: numeric("zero_to_100_s", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Trim = typeof trims.$inferSelect;
export type NewTrim = typeof trims.$inferInsert;
