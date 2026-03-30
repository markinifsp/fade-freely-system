
-- Allow authenticated users to insert barbearias (for signup)
CREATE POLICY "Authenticated users can create barbearia" ON public.barbearias
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert their own roles (for signup) 
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid());
