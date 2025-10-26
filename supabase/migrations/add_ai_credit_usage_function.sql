-- ============================================
-- AI Credit Usage Tracking Functions
-- ============================================

-- 1. Function to increment AI credit usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get current usage and total credit
  SELECT total_ai_used, total_ai_credit
  INTO v_current_used, v_total_credit
  FROM public.user_usages
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate remaining credits
  v_remaining := v_total_credit - v_current_used;

  -- Check if user has enough credits
  IF v_remaining < p_credits THEN
    RAISE EXCEPTION 'Insufficient AI credits. Remaining: %, Required: %', v_remaining, p_credits;
  END IF;

  -- Increment usage
  UPDATE public.user_usages
  SET
    total_ai_used = total_ai_used + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return updated stats
  RETURN jsonb_build_object(
    'success', true,
    'credits_used', p_credits,
    'total_used', v_current_used + p_credits,
    'total_credit', v_total_credit,
    'remaining', v_total_credit - (v_current_used + p_credits)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to check if user has enough AI credits
CREATE OR REPLACE FUNCTION public.check_ai_credits(p_user_id UUID, p_required_credits INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  v_current_used INTEGER;
  v_total_credit INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get current usage and total credit
  SELECT total_ai_used, total_ai_credit
  INTO v_current_used, v_total_credit
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
  v_remaining := v_total_credit - v_current_used;

  -- Return check result
  RETURN jsonb_build_object(
    'has_credits', v_remaining >= p_required_credits,
    'total_credit', v_total_credit,
    'total_used', v_current_used,
    'remaining', v_remaining,
    'required', p_required_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AI Credit Functions Created!
-- ============================================
