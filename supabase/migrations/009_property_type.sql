-- Add property_type field to properties table
-- Values: 'residential', 'commercial'

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'residential';

-- Add comment for documentation
COMMENT ON COLUMN properties.property_type IS 'Type of property: residential or commercial';
