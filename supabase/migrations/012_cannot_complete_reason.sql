-- Add reason field for work orders that cannot be completed
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS cannot_complete_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN work_logs.cannot_complete_reason IS 'Reason why the work order could not be completed (required when status is cannot-complete)';
