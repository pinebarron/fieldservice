-- Add location and unique key fields to vendors
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS vendor_key VARCHAR(50),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);

-- Create unique index on vendor_key per business
CREATE UNIQUE INDEX IF NOT EXISTS vendors_business_key_unique
  ON vendors(business_id, vendor_key)
  WHERE vendor_key IS NOT NULL;

COMMENT ON COLUMN vendors.vendor_key IS 'Unique identifier/code for this vendor within the business';
COMMENT ON COLUMN vendors.lat IS 'Latitude for route optimization';
COMMENT ON COLUMN vendors.lng IS 'Longitude for route optimization';
