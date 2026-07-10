-- Add admin_pin (hashed) and is_active to profiles
ALTER TABLE public.profiles
  ADD COLUMN admin_pin TEXT,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: hash a 5-digit PIN
CREATE OR REPLACE FUNCTION public.hash_admin_pin(p_pin TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT crypt(p_pin, gen_salt('bf', 8));
$$;

-- Helper: verify admin PIN (returns true if match)
CREATE OR REPLACE FUNCTION public.verify_admin_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND admin_pin IS NOT NULL
      AND admin_pin = crypt(p_pin, admin_pin)
  );
$$;

-- RPC: set admin PIN (only the account owner can call this on themselves)
CREATE OR REPLACE FUNCTION public.set_admin_pin(p_pin TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF length(p_pin) != 5 OR p_pin !~ '^\d{5}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 5 digits';
  END IF;
  UPDATE public.profiles
  SET admin_pin = crypt(p_pin, gen_salt('bf', 8))
  WHERE id = auth.uid();
  RETURN TRUE;
END;
$$;

-- RPC: change admin PIN (requires current PIN verification)
CREATE OR REPLACE FUNCTION public.change_admin_pin(p_current_pin TEXT, p_new_pin TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.verify_admin_pin(auth.uid(), p_current_pin) THEN
    RAISE EXCEPTION 'Incorrect current PIN';
  END IF;
  IF length(p_new_pin) != 5 OR p_new_pin !~ '^\d{5}$' THEN
    RAISE EXCEPTION 'New PIN must be exactly 5 digits';
  END IF;
  UPDATE public.profiles
  SET admin_pin = crypt(p_new_pin, gen_salt('bf', 8))
  WHERE id = auth.uid();
  RETURN TRUE;
END;
$$;

-- RPC: check if current user has admin_pin set
CREATE OR REPLACE FUNCTION public.admin_has_pin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT admin_pin IS NOT NULL FROM public.profiles WHERE id = auth.uid();
$$;