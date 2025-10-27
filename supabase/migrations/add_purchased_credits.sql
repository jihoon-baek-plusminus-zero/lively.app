-- Add purchased credits columns to user_usages table
-- This allows users to purchase additional credits beyond monthly subscription quota

-- Add purchased_recording_time column (in seconds)
ALTER TABLE user_usages
ADD COLUMN IF NOT EXISTS purchased_recording_time INTEGER DEFAULT 0;

-- Add purchased_ai_credit column
ALTER TABLE user_usages
ADD COLUMN IF NOT EXISTS purchased_ai_credit INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN user_usages.purchased_recording_time IS 'Additional purchased recording time in seconds (one-time purchase, persists across months)';
COMMENT ON COLUMN user_usages.purchased_ai_credit IS 'Additional purchased AI credits (one-time purchase, persists across months)';

-- Update existing rows to have default values
UPDATE user_usages
SET
  purchased_recording_time = 0,
  purchased_ai_credit = 0
WHERE
  purchased_recording_time IS NULL
  OR purchased_ai_credit IS NULL;
