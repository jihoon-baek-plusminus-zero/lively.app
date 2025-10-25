-- Function to delete user account and all related data
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_to_delete uuid;
BEGIN
  -- Get the current user's ID
  user_id_to_delete := auth.uid();

  IF user_id_to_delete IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete related data in order (respecting foreign keys)
  DELETE FROM embeddings WHERE lecture_id IN (SELECT id FROM lectures WHERE user_id = user_id_to_delete);
  DELETE FROM captions WHERE lecture_id IN (SELECT id FROM lectures WHERE user_id = user_id_to_delete);
  DELETE FROM chat_messages WHERE lecture_id IN (SELECT id FROM lectures WHERE user_id = user_id_to_delete);
  DELETE FROM lectures WHERE user_id = user_id_to_delete;

  -- Delete the user from auth.users (this will cascade delete the profile)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;
