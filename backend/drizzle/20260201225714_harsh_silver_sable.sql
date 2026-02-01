CREATE TABLE "ports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airtable_id" text,
	"name" text NOT NULL,
	"link" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ports_airtable_id_unique" UNIQUE("airtable_id")
);
--> statement-breakpoint
ALTER TABLE "sponsors" ADD COLUMN "airtable_id" text;