-- Create user_usages table for tracking user quotas and usage
CREATE TABLE IF NOT EXISTS public.user_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  signed_up_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_recordable_time INTEGER DEFAULT 10800 NOT NULL, -- 3 hours in seconds (3 * 60 * 60)
  total_recorded_time INTEGER DEFAULT 0 NOT NULL, -- Monthly usage in seconds
  total_ai_credit INTEGER DEFAULT 1000 NOT NULL, -- Monthly AI question quota
  total_ai_used INTEGER DEFAULT 0 NOT NULL, -- Monthly AI questions used
  current_period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) NOT NULL, -- Start of current billing period
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_usages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own usage data
CREATE POLICY "Users can view own usage data"
  ON public.user_usages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage data (for initial signup)
CREATE POLICY "Users can insert own usage data"
  ON public.user_usages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own usage data
CREATE POLICY "Users can update own usage data"
  ON public.user_usages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usages_user_id ON public.user_usages(user_id);

-- Function to automatically create user_usages entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usages (user_id, signed_up_date, current_period_start)
  VALUES (
    NEW.id,
    NOW(),
    DATE_TRUNC('month', NOW())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_usages entry automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Function to reset monthly usage (to be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.user_usages
  SET
    total_recorded_time = 0,
    total_ai_used = 0,
    current_period_start = DATE_TRUNC('month', NOW()),
    updated_at = NOW()
  WHERE DATE_TRUNC('month', current_period_start) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.user_usages IS 'Tracks user quotas and monthly usage for recordings and AI credits';
COMMENT ON COLUMN public.user_usages.total_recordable_time IS 'Monthly recording quota in seconds (default: 10800 = 3 hours)';
COMMENT ON COLUMN public.user_usages.total_recorded_time IS 'Current month recorded time in seconds (resets monthly)';
COMMENT ON COLUMN public.user_usages.total_ai_credit IS 'Monthly AI question quota (default: 1000)';
COMMENT ON COLUMN public.user_usages.total_ai_used IS 'Current month AI questions used (resets monthly)';
COMMENT ON COLUMN public.user_usages.current_period_start IS 'Start date of current billing period';
