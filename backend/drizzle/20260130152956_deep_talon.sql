ALTER TABLE "speakers" ADD COLUMN "speaking_topic" text;--> statement-breakpoint
ALTER TABLE "speakers" ADD COLUMN "synopsis" text;--> statement-breakpoint
ALTER TABLE "speakers" DROP COLUMN "linkedin_url";