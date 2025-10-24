-- Add audio_languages and translate_to columns to lectures table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE lectures
ADD COLUMN IF NOT EXISTS audio_languages TEXT[] DEFAULT ARRAY['ko', 'en']::TEXT[],
ADD COLUMN IF NOT EXISTS translate_to TEXT;

-- Add comments for documentation
COMMENT ON COLUMN lectures.audio_languages IS 'Array of language codes for STT recognition (e.g., [''ko'', ''en''])';
COMMENT ON COLUMN lectures.translate_to IS 'Target language code for translation (optional)';
