-- ============================================
-- Complete Database Setup for Livey Admin & User Usages
-- Run this once in Supabase SQL Editor
-- ============================================

-- 1. Create user_usages table
CREATE TABLE IF NOT EXISTS public.user_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  signed_up_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_recordable_time INTEGER DEFAULT 10800 NOT NULL,
  total_recorded_time INTEGER DEFAULT 0 NOT NULL,
  total_ai_credit INTEGER DEFAULT 1000 NOT NULL,
  total_ai_used INTEGER DEFAULT 0 NOT NULL,
  current_period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  is_super_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_usages_user_id ON public.user_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- 4. Enable RLS
ALTER TABLE public.user_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own usage data" ON public.user_usages;
DROP POLICY IF EXISTS "Users can insert own usage data" ON public.user_usages;
DROP POLICY IF EXISTS "Users can update own usage data" ON public.user_usages;
DROP POLICY IF EXISTS "Admins can view all user usages" ON public.user_usages;
DROP POLICY IF EXISTS "Admins can update all user usages" ON public.user_usages;
DROP POLICY IF EXISTS "Admins can delete all user usages" ON public.user_usages;
DROP POLICY IF EXISTS "Admin users can view admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can delete admin users" ON public.admin_users;

-- 6. Create RLS policies for user_usages
CREATE POLICY "Users can view own usage data"
  ON public.user_usages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage data"
  ON public.user_usages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage data"
  ON public.user_usages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user usages"
  ON public.user_usages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update all user usages"
  ON public.user_usages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete all user usages"
  ON public.user_usages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- 7. Create RLS policies for admin_users
CREATE POLICY "Admin users can view admin list"
  ON public.admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Super admin can insert admin users"
  ON public.admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_super_admin = TRUE
    )
  );

CREATE POLICY "Super admin can delete admin users"
  ON public.admin_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- 8. Create or replace functions
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usages (user_id, signed_up_date, current_period_start)
  VALUES (NEW.id, NOW(), DATE_TRUNC('month', NOW()))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.user_usages
  SET total_recorded_time = 0, total_ai_used = 0,
      current_period_start = DATE_TRUNC('month', NOW()), updated_at = NOW()
  WHERE DATE_TRUNC('month', current_period_start) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (id uuid, email text, created_at timestamptz) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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

-- 9. Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 10. Create user_usages records for existing users (if not exists)
INSERT INTO public.user_usages (user_id, signed_up_date, current_period_start)
SELECT
  id,
  created_at,
  DATE_TRUNC('month', NOW())
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_usages)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Setup Complete!
-- ============================================
