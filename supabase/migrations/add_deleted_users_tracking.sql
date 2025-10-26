-- ============================================
-- Add Deleted Users Tracking System
-- This prevents credit abuse on re-registration
-- ============================================

-- 1. Create deleted_users table
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  deleted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deleted_users_email_hash ON public.deleted_users(email_hash);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at ON public.deleted_users(deleted_at);

-- 3. Enable RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view deleted users" ON public.deleted_users;
DROP POLICY IF EXISTS "Admins can insert deleted users" ON public.deleted_users;
DROP POLICY IF EXISTS "Admins can delete deleted users" ON public.deleted_users;

-- 5. Create RLS policies for deleted_users (only admins can access)
CREATE POLICY "Admins can view deleted users"
  ON public.deleted_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert deleted users"
  ON public.deleted_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete deleted users"
  ON public.deleted_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- 6. Create helper function to hash email addresses
CREATE OR REPLACE FUNCTION public.hash_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(lower(trim(email)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Update admin_delete_user function to save to deleted_users
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  user_email TEXT;
  email_hash TEXT;
BEGIN
  -- Check admin authorization
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get user email before deletion
  SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;

  -- Hash the email
  email_hash := public.hash_email(user_email);

  -- Save to deleted_users table
  INSERT INTO public.deleted_users (email_hash, deleted_at)
  VALUES (email_hash, NOW())
  ON CONFLICT (email_hash)
  DO UPDATE SET deleted_at = NOW();

  -- Delete all user data
  DELETE FROM public.embeddings WHERE lecture_id IN (
    SELECT id FROM public.lectures WHERE user_id = target_user_id
  );
  DELETE FROM public.captions WHERE lecture_id IN (
    SELECT id FROM public.lectures WHERE user_id = target_user_id
  );
  DELETE FROM public.chat_messages WHERE lecture_id IN (
    SELECT id FROM public.lectures WHERE user_id = target_user_id
  );
  DELETE FROM public.lectures WHERE user_id = target_user_id;
  DELETE FROM public.user_usages WHERE user_id = target_user_id;
  DELETE FROM public.admin_users WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update handle_new_user_signup function to check deleted_users
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
      -- Grant normal credits (10800 seconds = 3 hours, 1000 AI credits)
      INSERT INTO public.user_usages (
        user_id,
        signed_up_date,
        current_period_start,
        total_recordable_time,
        total_ai_credit
      )
      VALUES (
        NEW.id,
        NOW(),
        DATE_TRUNC('month', NOW()),
        10800,
        1000
      )
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      -- No credits for re-signup within 30 days
      INSERT INTO public.user_usages (
        user_id,
        signed_up_date,
        current_period_start,
        total_recordable_time,
        total_ai_credit
      )
      VALUES (
        NEW.id,
        NOW(),
        DATE_TRUNC('month', NOW()),
        0,
        0
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  ELSE
    -- New user (not previously deleted): grant normal credits
    INSERT INTO public.user_usages (
      user_id,
      signed_up_date,
      current_period_start,
      total_recordable_time,
      total_ai_credit
    )
    VALUES (
      NEW.id,
      NOW(),
      DATE_TRUNC('month', NOW()),
      10800,
      1000
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Recreate trigger with updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================
-- Deleted Users Tracking Setup Complete!
-- ============================================
