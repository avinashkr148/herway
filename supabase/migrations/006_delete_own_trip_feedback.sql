create policy "delete own trip feedback" on trip_feedback for delete to authenticated using (
  user_id = auth.uid()
);
