-- Add title and phone fields to business_members
ALTER TABLE business_members
  ADD COLUMN IF NOT EXISTS title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN business_members.title IS 'Job title, e.g., Lead Technician, Service Manager';
COMMENT ON COLUMN business_members.phone IS 'Contact phone number';
