
-- ── RPC: staff PIN login ─────────────────────────────────────────────────────
-- Called anonymously from the login page.
-- Returns staff + store info when business name + staff name + PIN all match.
-- Case-insensitive name matching; strips extra whitespace.
-- SECURITY DEFINER so anon role can read staff + stores without full RLS bypass.

CREATE OR REPLACE FUNCTION public.staff_pin_login(
  p_business_name text,
  p_staff_name    text,
  p_pin           text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store   stores%ROWTYPE;
  v_staff   staff%ROWTYPE;
BEGIN
  -- 1. Find store by business name (case-insensitive)
  SELECT * INTO v_store
  FROM stores
  WHERE lower(trim(business_name)) = lower(trim(p_business_name))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'store_not_found');
  END IF;

  -- 2. Find active staff in that store matching name + PIN
  SELECT * INTO v_staff
  FROM staff
  WHERE store_id = v_store.id
    AND lower(trim(name)) = lower(trim(p_staff_name))
    AND pin = trim(p_pin)
    AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;

  -- 3. Return safe subset of staff + store info
  RETURN jsonb_build_object(
    'staff', jsonb_build_object(
      'id',       v_staff.id,
      'name',     v_staff.name,
      'role',     v_staff.role,
      'shift',    v_staff.shift,
      'store_id', v_staff.store_id
    ),
    'store', jsonb_build_object(
      'id',            v_store.id,
      'business_name', v_store.business_name,
      'business_type', v_store.business_type,
      'region',        v_store.region
    )
  );
END;
$$;

-- Grant execute to anonymous (login page is unauthenticated)
GRANT EXECUTE ON FUNCTION public.staff_pin_login(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.staff_pin_login(text, text, text) TO authenticated;
