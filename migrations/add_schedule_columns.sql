-- Add Google Calendar columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_access_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_refresh_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_token_expires_at" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_calendar_id" text;

-- Add scheduling columns to work_logs table
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "scheduled_start_time" text;
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "scheduled_end_time" text;
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "recurring_schedule_id" varchar;
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "is_recurrence_instance" text DEFAULT 'false';
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "google_calendar_event_id" text;
ALTER TABLE "work_logs" ADD COLUMN IF NOT EXISTS "google_calendar_synced_at" text;

-- Create recurring_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS "recurring_schedules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" varchar NOT NULL,
  "property_id" varchar,
  "customer_name" text NOT NULL,
  "work_type" text NOT NULL,
  "location_name" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "zip_code" text NOT NULL,
  "work_description" text NOT NULL,
  "notes" text,
  "technician_user_ids" json DEFAULT '[]'::json,
  "scheduled_time" text NOT NULL,
  "estimated_duration_minutes" text DEFAULT '60',
  "frequency" text NOT NULL,
  "interval" text DEFAULT '1' NOT NULL,
  "days_of_week" json DEFAULT '[]'::json,
  "day_of_month" text,
  "start_date" text NOT NULL,
  "end_date" text,
  "max_occurrences" text,
  "is_active" text DEFAULT 'true' NOT NULL,
  "last_generated_date" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_property_id_properties_id_fk"
    FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_recurring_schedule_id_recurring_schedules_id_fk"
    FOREIGN KEY ("recurring_schedule_id") REFERENCES "public"."recurring_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Form templates table (dynamic conditional forms)
CREATE TABLE IF NOT EXISTS "form_templates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" varchar NOT NULL REFERENCES businesses(id),
  "name" text NOT NULL,
  "description" text,
  "work_type" text,
  "schema" json NOT NULL,
  "logic_rules" json DEFAULT '[]'::json,
  "is_active" text DEFAULT 'true' NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Form submissions (linked to work logs)
CREATE TABLE IF NOT EXISTS "form_submissions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_log_id" varchar NOT NULL REFERENCES work_logs(id),
  "template_id" varchar NOT NULL REFERENCES form_templates(id),
  "responses" json NOT NULL,
  "submitted_at" timestamp DEFAULT now()
);

-- Work log tasks (sub-tasks created from forms or manually)
CREATE TABLE IF NOT EXISTS "work_log_tasks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_log_id" varchar NOT NULL REFERENCES work_logs(id),
  "parent_task_id" varchar REFERENCES work_log_tasks(id),
  "title" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "priority" text DEFAULT 'normal',
  "assigned_user_id" varchar REFERENCES users(id),
  "due_date" text,
  "created_from_form" varchar REFERENCES form_submissions(id),
  "created_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);
