CREATE TABLE "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"county" text DEFAULT 'Nairobi' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo" text,
	"subjects" text DEFAULT '' NOT NULL,
	"grade_levels" text DEFAULT '' NOT NULL,
	"philosophy" text DEFAULT '' NOT NULL,
	"hourly_rate_ksh" integer,
	"tsc_number" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"rater_user_id" text NOT NULL,
	"ratee_user_id" text NOT NULL,
	"stars" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_user_id" text NOT NULL,
	"educator_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vetting_doc" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"file_name" text NOT NULL,
	"mime" text NOT NULL,
	"data_url" text NOT NULL,
	"size_kb" integer NOT NULL,
	"orig_kb" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rating_once_idx" ON "rating" USING btree ("thread_id","rater_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "thread_pair_idx" ON "thread" USING btree ("parent_user_id","educator_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vetting_doc_user_kind_idx" ON "vetting_doc" USING btree ("user_id","kind");