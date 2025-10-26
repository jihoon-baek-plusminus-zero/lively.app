-- ============================================
-- Force Monthly Reset for All Users Based on Plan
-- ============================================

-- Reset all users' credits based on their subscription plan
UPDATE public.user_usages
SET
  -- Set recording time based on plan
  total_recordable_time = CASE
    WHEN subscribed_plan = 'free' THEN 36000  -- 10 hours
    ELSE 36000  -- Default to free plan
  END,
  -- Set AI credit based on plan
  total_ai_credit = CASE
    WHEN subscribed_plan = 'free' THEN 500
    ELSE 500  -- Default to free plan
  END,
  -- Reset usage to 0
  total_recorded_time = 0,
  total_ai_used = 0,
  -- Update period start to current month
  current_period_start = DATE_TRUNC('month', NOW()),
  updated_at = NOW();

-- Display results
SELECT
  subscribed_plan,
  COUNT(*) as user_count,
  total_recordable_time / 3600 as recording_hours,
  total_ai_credit as ai_credits,
  SUM(total_recorded_time) as total_used_recording,
  SUM(total_ai_used) as total_used_ai
FROM public.user_usages
GROUP BY subscribed_plan, total_recordable_time, total_ai_credit
ORDER BY subscribed_plan;
