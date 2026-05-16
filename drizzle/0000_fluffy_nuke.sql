CREATE SCHEMA "subaruclub";
--> statement-breakpoint
CREATE TABLE "subaruclub"."models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_full" text NOT NULL,
	"tagline_cs" text,
	"description_cs" text,
	"description_en_raw" text,
	"category" text NOT NULL,
	"production_start" integer,
	"production_end" integer,
	"hero_image_url" text,
	"wikidata_qid" text,
	"content_tier" text DEFAULT 'bronze' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subaruclub"."generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"year_start" integer,
	"year_end" integer,
	"description_cs" text,
	"description_en_raw" text,
	"hero_image_url" text,
	"chassis_codes" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subaruclub"."trims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"engine_code" text,
	"engine_displacement_cc" integer,
	"power_hp" integer,
	"torque_nm" integer,
	"drivetrain" text,
	"transmission" text,
	"top_speed_kmh" integer,
	"zero_to_100_s" numeric(4, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subaruclub"."media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_cs" text,
	"credit" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subaruclub"."cz_context" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid,
	"generation_id" uuid,
	"topic" text NOT NULL,
	"content_cs" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subaruclub"."generations" ADD CONSTRAINT "generations_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "subaruclub"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subaruclub"."trims" ADD CONSTRAINT "trims_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "subaruclub"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subaruclub"."cz_context" ADD CONSTRAINT "cz_context_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "subaruclub"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subaruclub"."cz_context" ADD CONSTRAINT "cz_context_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "subaruclub"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "generations_model_slug_unique" ON "subaruclub"."generations" USING btree ("model_id","slug");