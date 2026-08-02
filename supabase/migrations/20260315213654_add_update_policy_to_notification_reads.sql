CREATE POLICY "Users can update their own reads"
  ON notification_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
