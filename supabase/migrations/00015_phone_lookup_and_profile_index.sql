
-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- RPC: look up email by phone number (for forgot-password flow)
CREATE OR REPLACE FUNCTION get_email_by_phone(p_phone text)
RETURNS TABLE(user_email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM profiles
  WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+264', '0') =
        REPLACE(REPLACE(REPLACE(p_phone, ' ', ''), '-', ''), '+264', '0')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_phone(text) TO anon, authenticated;

-- RPC: look up email by phone for sign-in (same logic)
CREATE OR REPLACE FUNCTION get_email_by_phone_for_login(p_phone text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM profiles
  WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+264', '0') =
        REPLACE(REPLACE(REPLACE(p_phone, ' ', ''), '-', ''), '+264', '0')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_phone_for_login(text) TO anon, authenticated;
