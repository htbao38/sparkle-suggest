
CREATE POLICY "Users can view own behaviors"
ON public.user_behaviors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own behaviors"
ON public.user_behaviors FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
