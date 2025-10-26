-- Function to get user by email (for admin use)
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = current_user_id
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Return user data by email
  RETURN QUERY
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_user_by_email IS 'Allows admin users to search for a user by email address. Requires admin privileges.';
