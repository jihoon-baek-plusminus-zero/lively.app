-- ============================================
-- COMPLETE PURCHASED CREDITS MIGRATION
-- Apply this entire SQL file in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Add purchased credits columns
-- ============================================

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

-- ============================================
-- STEP 2: Update Recording Time Functions
-- ============================================

-- Drop and recreate increment_recording_usage function
DROP FUNCTION IF EXISTS public.increment_recording_usage(UUID, INTEGER);

CREATE FUNCTION public.increment_recording_usage(
  p_user_id UUID,
  p_seconds INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_quota INTEGER;
  v_purchased_time INTEGER;
  v_remaining_monthly INTEGER;
  v_seconds_from_monthly INTEGER;
  v_seconds_from_purchased INTEGER;
BEGIN
  -- Get current usage, total quota, and purchased credits
  SELECT
    total_recorded_time,
    total_recordable_time,
    COALESCE(purchased_recording_time, 0)
  INTO v_current_used, v_total_quota, v_purchased_time
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate remaining monthly quota
  v_remaining_monthly := v_total_quota - v_current_used;

  -- Priority 1: Use monthly quota first
  IF v_remaining_monthly >= p_seconds THEN
    -- Enough monthly quota remaining
    v_seconds_from_monthly := p_seconds;
    v_seconds_from_purchased := 0;

    UPDATE public.user_usages
    SET
      total_recorded_time = total_recorded_time + p_seconds,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSIF v_remaining_monthly > 0 THEN
    -- Partially use monthly, then purchased
    v_seconds_from_monthly := v_remaining_monthly;
    v_seconds_from_purchased := p_seconds - v_remaining_monthly;

    -- Check if enough purchased credits
    IF v_purchased_time < v_seconds_from_purchased THEN
      RAISE EXCEPTION 'Insufficient recording time. Monthly remaining: % seconds, Purchased: % seconds, Required: % seconds',
        v_remaining_monthly, v_purchased_time, p_seconds;
    END IF;

    UPDATE public.user_usages
    SET
      total_recorded_time = total_recorded_time + v_seconds_from_monthly,
      purchased_recording_time = purchased_recording_time - v_seconds_from_purchased,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSE
    -- Monthly quota exhausted, use only purchased credits
    v_seconds_from_monthly := 0;
    v_seconds_from_purchased := p_seconds;

    -- Check if enough purchased credits
    IF v_purchased_time < v_seconds_from_purchased THEN
      RAISE EXCEPTION 'Insufficient recording time. Monthly quota exhausted. Purchased: % seconds, Required: % seconds',
        v_purchased_time, p_seconds;
    END IF;

    UPDATE public.user_usages
    SET
      purchased_recording_time = purchased_recording_time - p_seconds,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Get updated values
  SELECT
    total_recorded_time,
    total_recordable_time,
    COALESCE(purchased_recording_time, 0)
  INTO v_current_used, v_total_quota, v_purchased_time
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Return updated stats
  RETURN jsonb_build_object(
    'success', true,
    'seconds_used', p_seconds,
    'seconds_from_monthly', v_seconds_from_monthly,
    'seconds_from_purchased', v_seconds_from_purchased,
    'monthly_used', v_current_used,
    'monthly_quota', v_total_quota,
    'monthly_remaining', GREATEST(0, v_total_quota - v_current_used),
    'purchased_remaining', v_purchased_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate check_recording_time function
DROP FUNCTION IF EXISTS public.check_recording_time(UUID, INTEGER);

CREATE FUNCTION public.check_recording_time(
  p_user_id UUID,
  p_required_seconds INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_quota INTEGER;
  v_purchased_time INTEGER;
  v_remaining_monthly INTEGER;
  v_total_available INTEGER;
BEGIN
  -- Get current usage, total quota, and purchased credits
  SELECT
    total_recorded_time,
    total_recordable_time,
    COALESCE(purchased_recording_time, 0)
  INTO v_current_used, v_total_quota, v_purchased_time
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_enough_time', false,
      'error', 'User not found'
    );
  END IF;

  -- Calculate remaining times
  v_remaining_monthly := GREATEST(0, v_total_quota - v_current_used);
  v_total_available := v_remaining_monthly + v_purchased_time;

  -- Return check result
  RETURN jsonb_build_object(
    'has_enough_time', v_total_available >= p_required_seconds,
    'monthly_quota', v_total_quota,
    'monthly_used', v_current_used,
    'monthly_remaining', v_remaining_monthly,
    'purchased_remaining', v_purchased_time,
    'total_available', v_total_available,
    'required', p_required_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Update AI Credit Functions
-- ============================================

-- Drop and recreate increment_ai_usage function
DROP FUNCTION IF EXISTS public.increment_ai_usage(UUID, INTEGER);

CREATE FUNCTION public.increment_ai_usage(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_purchased_credit INTEGER;
  v_remaining_monthly INTEGER;
  v_credits_from_monthly INTEGER;
  v_credits_from_purchased INTEGER;
BEGIN
  -- Get current usage, total credit, and purchased credits
  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate remaining monthly quota
  v_remaining_monthly := v_total_credit - v_current_used;

  -- Priority 1: Use monthly quota first
  IF v_remaining_monthly >= p_credits THEN
    -- Enough monthly quota remaining
    v_credits_from_monthly := p_credits;
    v_credits_from_purchased := 0;

    UPDATE public.user_usages
    SET
      total_ai_used = total_ai_used + p_credits,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSIF v_remaining_monthly > 0 THEN
    -- Partially use monthly, then purchased
    v_credits_from_monthly := v_remaining_monthly;
    v_credits_from_purchased := p_credits - v_remaining_monthly;

    -- Check if enough purchased credits
    IF v_purchased_credit < v_credits_from_purchased THEN
      RAISE EXCEPTION 'Insufficient AI credits. Monthly remaining: %, Purchased: %, Required: %',
        v_remaining_monthly, v_purchased_credit, p_credits;
    END IF;

    UPDATE public.user_usages
    SET
      total_ai_used = total_ai_used + v_credits_from_monthly,
      purchased_ai_credit = purchased_ai_credit - v_credits_from_purchased,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSE
    -- Monthly quota exhausted, use only purchased credits
    v_credits_from_monthly := 0;
    v_credits_from_purchased := p_credits;

    -- Check if enough purchased credits
    IF v_purchased_credit < v_credits_from_purchased THEN
      RAISE EXCEPTION 'Insufficient AI credits. Monthly quota exhausted. Purchased: %, Required: %',
        v_purchased_credit, p_credits;
    END IF;

    UPDATE public.user_usages
    SET
      purchased_ai_credit = purchased_ai_credit - p_credits,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Get updated values
  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Return updated stats
  RETURN jsonb_build_object(
    'success', true,
    'credits_used', p_credits,
    'credits_from_monthly', v_credits_from_monthly,
    'credits_from_purchased', v_credits_from_purchased,
    'monthly_used', v_current_used,
    'monthly_credit', v_total_credit,
    'monthly_remaining', GREATEST(0, v_total_credit - v_current_used),
    'purchased_remaining', v_purchased_credit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate check_ai_credits function
DROP FUNCTION IF EXISTS public.check_ai_credits(UUID, INTEGER);

CREATE FUNCTION public.check_ai_credits(p_user_id UUID, p_required_credits INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_purchased_credit INTEGER;
  v_remaining_monthly INTEGER;
  v_total_available INTEGER;
BEGIN
  -- Get current usage, total credit, and purchased credits
  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_credits', false,
      'error', 'User not found'
    );
  END IF;

  -- Calculate remaining credits
  v_remaining_monthly := GREATEST(0, v_total_credit - v_current_used);
  v_total_available := v_remaining_monthly + v_purchased_credit;

  -- Return check result
  RETURN jsonb_build_object(
    'has_credits', v_total_available >= p_required_credits,
    'monthly_credit', v_total_credit,
    'monthly_used', v_current_used,
    'monthly_remaining', v_remaining_monthly,
    'purchased_remaining', v_purchased_credit,
    'total_available', v_total_available,
    'required', p_required_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Update get_all_users_with_usage RPC
-- ============================================

DROP FUNCTION IF EXISTS public.get_all_users_with_usage();

CREATE FUNCTION public.get_all_users_with_usage()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  signed_up_date TIMESTAMP WITH TIME ZONE,
  total_recordable_time INTEGER,
  total_recorded_time INTEGER,
  total_ai_credit INTEGER,
  total_ai_used INTEGER,
  purchased_recording_time INTEGER,
  purchased_ai_credit INTEGER,
  current_period_start TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uu.user_id,
    u.email::TEXT,
    uu.signed_up_date,
    uu.total_recordable_time,
    uu.total_recorded_time,
    uu.total_ai_credit,
    uu.total_ai_used,
    COALESCE(uu.purchased_recording_time, 0) as purchased_recording_time,
    COALESCE(uu.purchased_ai_credit, 0) as purchased_ai_credit,
    uu.current_period_start,
    uu.created_at,
    uu.updated_at
  FROM user_usages uu
  INNER JOIN auth.users u ON uu.user_id = u.id
  ORDER BY uu.created_at DESC;
END;
$$;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- All purchased credits functionality is now active:
-- ✅ Columns added to user_usages table
-- ✅ Recording functions updated with priority deduction
-- ✅ AI credit functions updated with priority deduction
-- ✅ RPC function updated to return purchased credits
-- ============================================
