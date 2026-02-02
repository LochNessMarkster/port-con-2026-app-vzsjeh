CREATE TABLE "favorite_exhibitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exhibitor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorite_exhibitors" ADD CONSTRAINT "favorite_exhibitors_exhibitor_id_exhibitors_id_fk" FOREIGN KEY ("exhibitor_id") REFERENCES "public"."exhibitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_exhibitor_idx" ON "favorite_exhibitors" USING btree ("user_id","exhibitor_id");