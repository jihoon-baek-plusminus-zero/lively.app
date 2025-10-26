-- ============================================
-- Recording Time Usage Tracking Functions
-- ============================================

-- 1. Function to increment recording time usage
CREATE OR REPLACE FUNCTION public.increment_recording_usage(
  p_user_id UUID,
  p_seconds INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_quota INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get current usage and total quota
  SELECT total_recorded_time, total_recordable_time
  INTO v_current_used, v_total_quota
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate remaining time
  v_remaining := v_total_quota - v_current_used;

  -- Check if user has enough time
  IF v_remaining < p_seconds THEN
    RAISE EXCEPTION 'Insufficient recording time. Remaining: % seconds, Required: % seconds', v_remaining, p_seconds;
  END IF;

  -- Increment usage
  UPDATE public.user_usages
  SET
    total_recorded_time = total_recorded_time + p_seconds,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return updated stats
  RETURN jsonb_build_object(
    'success', true,
    'seconds_used', p_seconds,
    'total_used', v_current_used + p_seconds,
    'total_quota', v_total_quota,
    'remaining_time', v_total_quota - (v_current_used + p_seconds)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to check if user has enough recording time
CREATE OR REPLACE FUNCTION public.check_recording_time(
  p_user_id UUID,
  p_required_seconds INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_quota INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get current usage and total quota
  SELECT total_recorded_time, total_recordable_time
  INTO v_current_used, v_total_quota
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_enough_time', false,
      'error', 'User not found'
    );
  END IF;

  -- Calculate remaining time
  v_remaining := v_total_quota - v_current_used;

  -- Return check result
  RETURN jsonb_build_object(
    'has_enough_time', v_remaining >= p_required_seconds,
    'total_quota', v_total_quota,
    'total_used', v_current_used,
    'remaining_time', v_remaining,
    'required', p_required_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Recording Usage Tracking Functions Created!
-- ============================================
