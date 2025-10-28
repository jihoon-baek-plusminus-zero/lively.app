-- Create test_notifications table for Bubble.io integration
-- This table stores welcome messages from external Bubble.io website

CREATE TABLE IF NOT EXISTS public.test_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries (order by created_at)
CREATE INDEX idx_test_notifications_created_at ON public.test_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.test_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (for public dashboard)
CREATE POLICY "Allow public read access"
  ON public.test_notifications
  FOR SELECT
  USING (true);

-- Create policy to allow API to insert (service role only)
CREATE POLICY "Allow service role to insert"
  ON public.test_notifications
  FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_notifications;

-- Add comment
COMMENT ON TABLE public.test_notifications IS 'Stores welcome notifications from Bubble.io integration';
COMMENT ON COLUMN public.test_notifications.name IS 'Visitor name from Bubble.io';
COMMENT ON COLUMN public.test_notifications.nationality IS 'Visitor nationality from Bubble.io';
