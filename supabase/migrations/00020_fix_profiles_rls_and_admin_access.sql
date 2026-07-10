-- Allow every authenticated user to read their own profile row
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow every authenticated user to update their own profile row
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role unrestricted access (for edge functions / admin ops)
CREATE POLICY "profiles_service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);