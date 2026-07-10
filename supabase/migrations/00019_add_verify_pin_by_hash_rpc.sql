-- Check if a given bcrypt hash is already stored by any admin (for PIN uniqueness)
CREATE OR REPLACE FUNCTION public.verify_admin_pin_by_hash(p_candidate_hash TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE admin_pin IS NOT NULL
      AND admin_pin = p_candidate_hash
  );
$$;