-- Add industry field to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS industry VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN businesses.industry IS 'Industry type: solar, roofing, hvac, plumbing, electrical, landscaping, etc.';
