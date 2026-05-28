-- Add geocoding columns to properties and work_logs
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================
-- Add lat/lng to properties (job sites)
-- =============================================
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_source TEXT; -- 'nominatim', 'google', 'manual'

CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng);

-- =============================================
-- Add job site lat/lng to work_logs
-- =============================================
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS job_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS job_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_source TEXT;

CREATE INDEX IF NOT EXISTS idx_work_logs_job_location ON work_logs(job_lat, job_lng);

-- =============================================
-- Function to calculate distance between two points (meters)
-- =============================================
CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DECIMAL, lng1 DECIMAL,
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371000; -- Earth's radius in meters
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;

    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- View for jobs needing geocoding
-- =============================================
CREATE OR REPLACE VIEW jobs_needing_geocoding AS
SELECT
    'work_log' as source_type,
    id,
    business_id,
    location_name,
    city,
    state,
    zip_code,
    job_lat as lat,
    job_lng as lng,
    geocoded_at
FROM work_logs
WHERE job_lat IS NULL AND city IS NOT NULL AND state IS NOT NULL
UNION ALL
SELECT
    'property' as source_type,
    id,
    business_id,
    location_name,
    city,
    state,
    zip_code,
    lat,
    lng,
    geocoded_at
FROM properties
WHERE lat IS NULL AND city IS NOT NULL AND state IS NOT NULL;
