-- Add customer confirmation fields to work_logs table
-- Tracks whether customer has confirmed the appointment

ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN work_logs.customer_confirmed IS 'Whether the customer has confirmed the appointment';
COMMENT ON COLUMN work_logs.confirmed_at IS 'Timestamp when the customer confirmed the appointment';
