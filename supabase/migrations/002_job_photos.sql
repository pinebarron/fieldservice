-- Job Photos table for GPS-verified photo storage
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================
-- Job Photos table
-- =============================================
CREATE TABLE IF NOT EXISTS job_photos (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    work_log_id VARCHAR REFERENCES work_logs(id) ON DELETE SET NULL,

    -- Photo storage
    url TEXT NOT NULL,
    storage_path TEXT,

    -- Photo classification
    photo_type TEXT NOT NULL DEFAULT 'general', -- 'before', 'after', 'general'

    -- GPS data captured at shutter time
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    accuracy_meters DECIMAL(10, 2),
    altitude_meters DECIMAL(10, 2),

    -- Verification against job location
    job_lat DECIMAL(10, 8),
    job_lng DECIMAL(11, 8),
    distance_from_job_meters DECIMAL(10, 2),
    location_verified BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'mismatch', 'override'
    verification_notes TEXT,
    verified_by VARCHAR REFERENCES users(id),
    verified_at TIMESTAMP,

    -- Metadata
    captured_at TIMESTAMP NOT NULL,
    captured_by VARCHAR REFERENCES users(id),
    technician_name TEXT,
    device_info JSONB,
    exif_data JSONB,

    -- Annotations (if any)
    annotations JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_photos_business ON job_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_work_log ON job_photos(work_log_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_captured_by ON job_photos(captured_by);
CREATE INDEX IF NOT EXISTS idx_job_photos_captured_at ON job_photos(captured_at);
CREATE INDEX IF NOT EXISTS idx_job_photos_verification ON job_photos(verification_status);
CREATE INDEX IF NOT EXISTS idx_job_photos_location ON job_photos(lat, lng);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_photos_updated_at ON job_photos;
CREATE TRIGGER job_photos_updated_at
    BEFORE UPDATE ON job_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_job_photos_updated_at();
