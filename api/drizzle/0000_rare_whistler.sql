CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"logo" text,
	"job_title" text,
	"location" text,
	"salary" text,
	"employment_type" text,
	"experience" text,
	"remote" boolean DEFAULT false,
	"skills" jsonb,
	"job_url" text,
	"deadline" text,
	"notes" text,
	"status" text DEFAULT 'saved',
	"applied_date" text,
	"reply_date" text,
	"interview_date" text,
	"source" text,
	"created_date" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "created_date_idx" ON "jobs" USING btree ("created_date");