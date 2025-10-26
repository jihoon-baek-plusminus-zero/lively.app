-- Function for admins to delete user account and all related data
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
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

  -- Delete related data in order (respecting foreign keys)
  -- Delete embeddings first
  DELETE FROM embeddings
  WHERE lecture_id IN (
    SELECT id FROM lectures WHERE user_id = target_user_id
  );

  -- Delete captions
  DELETE FROM captions
  WHERE lecture_id IN (
    SELECT id FROM lectures WHERE user_id = target_user_id
  );

  -- Delete chat messages
  DELETE FROM chat_messages
  WHERE lecture_id IN (
    SELECT id FROM lectures WHERE user_id = target_user_id
  );

  -- Delete lectures
  DELETE FROM lectures WHERE user_id = target_user_id;

  -- Delete user usage data
  DELETE FROM user_usages WHERE user_id = target_user_id;

  -- Delete admin record if exists
  DELETE FROM admin_users WHERE user_id = target_user_id;

  -- Delete the user from auth.users (this will cascade delete related records)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION admin_delete_user IS 'Allows admin users to delete any user account and all related data. Requires admin privileges.';
