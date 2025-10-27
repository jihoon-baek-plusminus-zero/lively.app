-- ============================================
-- Update Recording Time Usage Tracking Functions
-- Add support for purchased credits with priority deduction
-- ============================================

-- 1. Updated Function to increment recording time usage (with purchased credits support)
CREATE OR REPLACE FUNCTION public.increment_recording_usage(
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

-- 2. Updated Function to check if user has enough recording time
CREATE OR REPLACE FUNCTION public.check_recording_time(
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
-- Recording Usage Tracking Functions Updated!
-- Now supports purchased credits with priority deduction
-- ============================================
