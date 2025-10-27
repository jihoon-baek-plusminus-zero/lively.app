-- Update get_all_users_with_usage function to include purchased credits
-- This function returns all users with their usage data including purchased credits

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_all_users_with_usage();

-- Create the updated function
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
