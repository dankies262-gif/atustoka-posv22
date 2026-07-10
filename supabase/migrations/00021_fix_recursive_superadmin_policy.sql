-- Drop the policy with the inline self-referencing subquery (causes infinite recursion)
DROP POLICY "Superadmin can read all profiles" ON public.profiles;

-- Recreate it using the existing SECURITY DEFINER function (bypasses RLS — no recursion)
CREATE POLICY "Superadmin can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_superadmin());

-- Also drop the duplicate policies added in the previous fix (already covered by originals)
DROP POLICY "profiles_select_own" ON public.profiles;
DROP POLICY "profiles_update_own" ON public.profiles;