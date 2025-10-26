-- ============================================
-- Add Subscription Plan and Monthly Reset Logic
-- ============================================

-- 1. Add subscribed_plan column to user_usages table
ALTER TABLE public.user_usages
ADD COLUMN IF NOT EXISTS subscribed_plan TEXT DEFAULT 'free' NOT NULL;

-- 2. Update existing users to have 'free' plan
UPDATE public.user_usages
SET subscribed_plan = 'free'
WHERE subscribed_plan IS NULL;

-- 3. Create index for faster lookups by plan
CREATE INDEX IF NOT EXISTS idx_user_usages_subscribed_plan ON public.user_usages(subscribed_plan);

-- 4. Update reset_monthly_usage function to reset based on plan
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  -- Reset usage for all users based on their subscription plan
  UPDATE public.user_usages
  SET
    -- Reset recording time based on plan
    total_recordable_time = CASE
      WHEN subscribed_plan = 'free' THEN 36000  -- 10 hours in seconds
      ELSE 36000  -- Default to free plan for now
    END,
    -- Reset AI credit based on plan
    total_ai_credit = CASE
      WHEN subscribed_plan = 'free' THEN 500
      ELSE 500  -- Default to free plan for now
    END,
    -- Reset used amounts to 0
    total_recorded_time = 0,
    total_ai_used = 0,
    -- Update period start date
    current_period_start = DATE_TRUNC('month', NOW()),
    updated_at = NOW()
  WHERE DATE_TRUNC('month', current_period_start) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update handle_new_user_signup to set initial values for free plan
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  email_hash TEXT;
  deleted_record RECORD;
  grant_credits BOOLEAN;
  days_since_deletion INTEGER;
BEGIN
  -- Hash the new user's email
  email_hash := public.hash_email(NEW.email);

  -- Check if this email was previously deleted
  SELECT * INTO deleted_record
  FROM public.deleted_users
  WHERE email_hash = email_hash;

  IF FOUND THEN
    -- Calculate days since deletion
    days_since_deletion := EXTRACT(DAY FROM NOW() - deleted_record.deleted_at);

    -- Determine if we should grant credits
    IF days_since_deletion >= 30 THEN
      -- More than 30 days: grant credits
      grant_credits := TRUE;
    ELSE
      -- Less than 30 days: no credits
      grant_credits := FALSE;
    END IF;

    -- Delete the record from deleted_users (cleanup)
    DELETE FROM public.deleted_users WHERE email_hash = email_hash;

    -- Insert user_usages with conditional credits
    IF grant_credits THEN
      -- Grant free plan credits (36000 seconds = 10 hours, 500 AI credits)
      INSERT INTO public.user_usages (
        user_id,
        signed_up_date,
        current_period_start,
        subscribed_plan,
        total_recordable_time,
        total_ai_credit,
        total_recorded_time,
        total_ai_used
      )
      VALUES (
        NEW.id,
        NOW(),
        DATE_TRUNC('month', NOW()),
        'free',
        36000,  -- 10 hours
        500,    -- 500 AI credits
        0,
        0
      )
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      -- No credits for re-signup within 30 days
      INSERT INTO public.user_usages (
        user_id,
        signed_up_date,
        current_period_start,
        subscribed_plan,
        total_recordable_time,
        total_ai_credit,
        total_recorded_time,
        total_ai_used
      )
      VALUES (
        NEW.id,
        NOW(),
        DATE_TRUNC('month', NOW()),
        'free',
        0,
        0,
        0,
        0
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  ELSE
    -- New user (not previously deleted): grant free plan credits
    INSERT INTO public.user_usages (
      user_id,
      signed_up_date,
      current_period_start,
      subscribed_plan,
      total_recordable_time,
      total_ai_credit,
      total_recorded_time,
      total_ai_used
    )
    VALUES (
      NEW.id,
      NOW(),
      DATE_TRUNC('month', NOW()),
      'free',
      36000,  -- 10 hours
      500,    -- 500 AI credits
      0,
      0
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate trigger with updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 7. Update existing users to have free plan credits (10 hours, 500 AI credits)
-- Only update users who still have the old default values
UPDATE public.user_usages
SET
  subscribed_plan = 'free',
  total_recordable_time = 36000,  -- 10 hours
  total_ai_credit = 500            -- 500 AI credits
WHERE subscribed_plan IS NULL
   OR (total_recordable_time = 10800 AND total_ai_credit = 1000);

-- ============================================
-- Subscription Plan Setup Complete!
--
-- Free Plan:
-- - 10 hours (36,000 seconds) recording time per month
-- - 500 AI credits per month
-- - Resets on the 1st of each month
--
-- To trigger monthly reset manually, run:
-- SELECT public.reset_monthly_usage();
-- ============================================
