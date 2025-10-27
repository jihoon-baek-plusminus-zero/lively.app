-- ============================================
-- VERIFY AND FIX: Check and recreate all functions
-- ============================================

-- First, let's check what the current function returns
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('check_recording_time', 'increment_recording_usage', 'check_ai_credits', 'increment_ai_usage');

-- ============================================
-- Now let's DROP and RECREATE all functions
-- ============================================

-- DROP ALL EXISTING FUNCTIONS
DROP FUNCTION IF EXISTS public.check_recording_time(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.increment_recording_usage(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.check_ai_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.increment_ai_usage(UUID, INTEGER);

-- ============================================
-- RECREATE: check_recording_time
-- ============================================
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

  -- Return check result with new format
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
-- RECREATE: increment_recording_usage
-- ============================================
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
    v_seconds_from_monthly := p_seconds;
    v_seconds_from_purchased := 0;

    UPDATE public.user_usages
    SET
      total_recorded_time = total_recorded_time + p_seconds,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSIF v_remaining_monthly > 0 THEN
    v_seconds_from_monthly := v_remaining_monthly;
    v_seconds_from_purchased := p_seconds - v_remaining_monthly;

    IF v_purchased_time < v_seconds_from_purchased THEN
      RAISE EXCEPTION 'Insufficient recording time';
    END IF;

    UPDATE public.user_usages
    SET
      total_recorded_time = total_recorded_time + v_seconds_from_monthly,
      purchased_recording_time = purchased_recording_time - v_seconds_from_purchased,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSE
    v_seconds_from_monthly := 0;
    v_seconds_from_purchased := p_seconds;

    IF v_purchased_time < v_seconds_from_purchased THEN
      RAISE EXCEPTION 'Insufficient recording time';
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

-- ============================================
-- RECREATE: check_ai_credits
-- ============================================
CREATE FUNCTION public.check_ai_credits(
  p_user_id UUID,
  p_required_credits INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_purchased_credit INTEGER;
  v_remaining_monthly INTEGER;
  v_total_available INTEGER;
BEGIN
  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_credits', false,
      'error', 'User not found'
    );
  END IF;

  v_remaining_monthly := GREATEST(0, v_total_credit - v_current_used);
  v_total_available := v_remaining_monthly + v_purchased_credit;

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
-- RECREATE: increment_ai_usage
-- ============================================
CREATE FUNCTION public.increment_ai_usage(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_purchased_credit INTEGER;
  v_remaining_monthly INTEGER;
  v_credits_from_monthly INTEGER;
  v_credits_from_purchased INTEGER;
BEGIN
  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_remaining_monthly := v_total_credit - v_current_used;

  IF v_remaining_monthly >= p_credits THEN
    v_credits_from_monthly := p_credits;
    v_credits_from_purchased := 0;

    UPDATE public.user_usages
    SET
      total_ai_used = total_ai_used + p_credits,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSIF v_remaining_monthly > 0 THEN
    v_credits_from_monthly := v_remaining_monthly;
    v_credits_from_purchased := p_credits - v_remaining_monthly;

    IF v_purchased_credit < v_credits_from_purchased THEN
      RAISE EXCEPTION 'Insufficient AI credits';
    END IF;

    UPDATE public.user_usages
    SET
      total_ai_used = total_ai_used + v_credits_from_monthly,
      purchased_ai_credit = purchased_ai_credit - v_credits_from_purchased,
      updated_at = NOW()
    WHERE user_id = p_user_id;

  ELSE
    v_credits_from_monthly := 0;
    v_credits_from_purchased := p_credits;

    IF v_purchased_credit < v_credits_from_purchased THEN
      RAISE EXCEPTION 'Insufficient AI credits';
    END IF;

    UPDATE public.user_usages
    SET
      purchased_ai_credit = purchased_ai_credit - p_credits,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  SELECT
    total_ai_used,
    total_ai_credit,
    COALESCE(purchased_ai_credit, 0)
  INTO v_current_used, v_total_credit, v_purchased_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

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

-- ============================================
-- VERIFICATION: Test the functions
-- ============================================

-- Test check_recording_time (replace with your actual user_id)
-- SELECT public.check_recording_time('YOUR_USER_ID_HERE'::uuid, 1);

-- Test check_ai_credits (replace with your actual user_id)
-- SELECT public.check_ai_credits('YOUR_USER_ID_HERE'::uuid, 1);

-- ============================================
-- ALL FUNCTIONS RECREATED!
-- ============================================
