-- Photo Form Integration Migration
-- Links photos to form fields for unified photo management
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================
-- Add form field reference to job_photos
-- =============================================

-- Add column to link photos to specific form fields
ALTER TABLE job_photos
ADD COLUMN IF NOT EXISTS form_field_id VARCHAR;

-- Add column to link photos to form submissions
ALTER TABLE job_photos
ADD COLUMN IF NOT EXISTS form_submission_id VARCHAR;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_photos_form_field ON job_photos(form_field_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_form_submission ON job_photos(form_submission_id);

-- =============================================
-- Enable RLS on job_photos if not already enabled
-- =============================================
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Service role bypass policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_photos'
    AND policyname = 'Service role has full access to job_photos'
  ) THEN
    CREATE POLICY "Service role has full access to job_photos"
    ON job_photos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================
-- Comments for documentation
-- =============================================
COMMENT ON COLUMN job_photos.form_field_id IS 'ID of the form field that captured this photo (e.g., "before_photos", "after_photos")';
COMMENT ON COLUMN job_photos.form_submission_id IS 'ID of the form_submissions record this photo belongs to';
