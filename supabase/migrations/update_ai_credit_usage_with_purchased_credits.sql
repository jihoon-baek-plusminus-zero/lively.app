-- ============================================
-- Update AI Credit Usage Tracking Functions
-- Add support for purchased credits with priority deduction
-- ============================================

-- 1. Updated Function to increment AI credit usage (with purchased credits support)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_credits INTEGER DEFAULT 1)
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

-- 2. Updated Function to check if user has enough AI credits
CREATE OR REPLACE FUNCTION public.check_ai_credits(p_user_id UUID, p_required_credits INTEGER DEFAULT 1)
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
-- AI Credit Functions Updated!
-- Now supports purchased credits with priority deduction
-- ============================================
