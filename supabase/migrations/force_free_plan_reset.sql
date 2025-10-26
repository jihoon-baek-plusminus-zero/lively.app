-- ============================================
-- Force All Users to Free Plan and Reset Credits
-- ============================================

-- Update all users to free plan and reset their credits
UPDATE public.user_usages
SET
  subscribed_plan = 'free',
  total_recordable_time = 36000,  -- 10 hours
  total_ai_credit = 500,           -- 500 AI credits
  total_recorded_time = 0,         -- Reset used recording time
  total_ai_used = 0,               -- Reset used AI credits
  current_period_start = DATE_TRUNC('month', NOW()),
  updated_at = NOW();

-- Verify the update
SELECT
  COUNT(*) as total_users,
  subscribed_plan,
  total_recordable_time / 3600 as hours,
  total_ai_credit as ai_credits
FROM public.user_usages
GROUP BY subscribed_plan, total_recordable_time, total_ai_credit;
