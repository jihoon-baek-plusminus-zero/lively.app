-- Add admin policies to user_usages table

-- Policy: Admins can view all user usage data
CREATE POLICY "Admins can view all usage data"
  ON public.user_usages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can update all user usage data
CREATE POLICY "Admins can update all usage data"
  ON public.user_usages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can delete all user usage data
CREATE POLICY "Admins can delete all usage data"
  ON public.user_usages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON POLICY "Admins can view all usage data" ON public.user_usages IS 'Allows admin users to view all user usage data';
COMMENT ON POLICY "Admins can update all usage data" ON public.user_usages IS 'Allows admin users to update all user usage data';
COMMENT ON POLICY "Admins can delete all usage data" ON public.user_usages IS 'Allows admin users to delete all user usage data';
