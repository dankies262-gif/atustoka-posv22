
-- Helper: check if calling user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- Allow superadmins to read ALL sales (platform-wide counts)
DROP POLICY IF EXISTS "Superadmin can read all sales" ON sales;
CREATE POLICY "Superadmin can read all sales" ON sales
FOR SELECT TO authenticated
USING (is_superadmin());

-- Allow superadmins to read ALL products (platform-wide counts)
DROP POLICY IF EXISTS "Superadmin can read all products" ON products;
CREATE POLICY "Superadmin can read all products" ON products
FOR SELECT TO authenticated
USING (is_superadmin());

-- Allow superadmins to update any user's role (for admin promotion UI)
DROP POLICY IF EXISTS "Superadmin can update user roles" ON profiles;
CREATE POLICY "Superadmin can update user roles" ON profiles
FOR UPDATE TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Platform-wide stats function (bypasses RLS, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_users   int;
  v_stores  int;
  v_sales   int;
  v_products int;
BEGIN
  -- Only superadmins may call this
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*)::int INTO v_users   FROM profiles;
  SELECT COUNT(*)::int INTO v_stores  FROM stores;
  SELECT COUNT(*)::int INTO v_sales   FROM sales;
  SELECT COUNT(*)::int INTO v_products FROM products WHERE active = true;

  RETURN json_build_object(
    'total_users',    v_users,
    'total_stores',   v_stores,
    'total_sales',    v_sales,
    'total_products', v_products
  );
END;
$$;

-- Admin user overview function (bypasses RLS, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_admin_user_overview()
RETURNS TABLE (
  id           uuid,
  email        text,
  full_name    text,
  role         text,
  created_at   timestamptz,
  store_count  bigint,
  latest_store_name text,
  latest_store_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    COUNT(s.id)          AS store_count,
    MAX(s.business_name) AS latest_store_name,
    MAX(s.business_type) AS latest_store_type
  FROM profiles p
  LEFT JOIN stores s ON s.owner_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.role, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Admin stores overview function (bypasses RLS, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_admin_stores_overview()
RETURNS TABLE (
  id            uuid,
  business_name text,
  business_type text,
  region        text,
  created_at    timestamptz,
  owner_email   text,
  owner_name    text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    st.id,
    st.business_name,
    st.business_type,
    st.region,
    st.created_at,
    p.email   AS owner_email,
    p.full_name AS owner_name
  FROM stores st
  LEFT JOIN profiles p ON p.id = st.owner_id
  ORDER BY st.created_at DESC;
END;
$$;

-- Allow superadmins to call these functions
GRANT EXECUTE ON FUNCTION get_platform_stats()           TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_user_overview()      TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stores_overview()    TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin()               TO authenticated;
