-- Add invite-related columns to business_members table
ALTER TABLE business_members
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMP WITH TIME ZONE;

-- Create index on invite_token for quick lookups
CREATE INDEX IF NOT EXISTS idx_business_members_invite_token
  ON business_members(invite_token)
  WHERE invite_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN business_members.invite_token IS 'Unique token sent to invited team members for account setup';
COMMENT ON COLUMN business_members.invite_sent_at IS 'When the invite was sent';
COMMENT ON COLUMN business_members.invite_accepted_at IS 'When the invite was accepted and user set up their account';
