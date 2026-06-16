-- Add customer feedback/scorecard fields to work_logs table

-- Unique token for public feedback link
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS feedback_token VARCHAR(64) UNIQUE;

-- When scorecard was sent to customer
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS feedback_sent_at TIMESTAMPTZ;

-- Customer's feedback response (JSON with ratings and comment)
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS feedback_response JSONB;

-- When feedback was submitted
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMPTZ;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_work_logs_feedback_token ON work_logs(feedback_token) WHERE feedback_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN work_logs.feedback_token IS 'Unique token for public feedback/scorecard link';
COMMENT ON COLUMN work_logs.feedback_sent_at IS 'When the scorecard link was sent to the customer';
COMMENT ON COLUMN work_logs.feedback_response IS 'Customer feedback: {quality, professionalism, value, timeliness, comment}';
COMMENT ON COLUMN work_logs.feedback_submitted_at IS 'When the customer submitted their feedback';
