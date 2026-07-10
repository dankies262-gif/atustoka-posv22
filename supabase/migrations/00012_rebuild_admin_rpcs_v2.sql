
-- ── Drop old versions first ────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_platform_stats();
DROP FUNCTION IF EXISTS public.get_admin_user_overview();
DROP FUNCTION IF EXISTS public.get_admin_stores_overview();
DROP FUNCTION IF EXISTS public.get_signup_timeline();
DROP FUNCTION IF EXISTS public.get_recent_error_logs(int);

-- ── 1. Platform stats ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Must be called by an authenticated superadmin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;

  RETURN jsonb_build_object(
    'total_users',    (SELECT COUNT(*)::int FROM profiles),
    'total_stores',   (SELECT COUNT(*)::int FROM stores),
    'total_sales',    (SELECT COUNT(*)::int FROM sales),
    'total_products', (SELECT COUNT(*)::int FROM products WHERE active = true),
    'errors_today',   (SELECT COUNT(*)::int FROM error_logs  WHERE created_at >= current_date),
    'new_today',      (SELECT COUNT(*)::int FROM profiles    WHERE created_at >= current_date),
    'new_this_week',  (SELECT COUNT(*)::int FROM profiles    WHERE created_at >= (current_date - interval '7 days'))
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- ── 2. User overview (all signups) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_user_overview()
RETURNS TABLE (
  id                uuid,
  email             text,
  full_name         text,
  role              text,
  created_at        timestamptz,
  store_count       int,
  latest_store_name text,
  latest_store_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    COUNT(s.id)::int          AS store_count,
    MAX(s.business_name)      AS latest_store_name,
    MAX(s.business_type)      AS latest_store_type
  FROM profiles p
  LEFT JOIN stores s ON s.owner_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.role, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_user_overview() TO authenticated;

-- ── 3. Stores overview (all registered businesses) ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_stores_overview()
RETURNS TABLE (
  id            uuid,
  business_name text,
  business_type text,
  region        text,
  owner_email   text,
  owner_name    text,
  created_at    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;

  RETURN QUERY
  SELECT
    st.id,
    st.business_name,
    st.business_type,
    st.region,
    p.email       AS owner_email,
    p.full_name   AS owner_name,
    st.created_at
  FROM stores st
  LEFT JOIN profiles p ON p.id = st.owner_id
  ORDER BY st.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_stores_overview() TO authenticated;

-- ── 4. Signup timeline (last 30 days) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_signup_timeline()
RETURNS TABLE (
  signup_date date,
  count       int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;

  RETURN QUERY
  SELECT
    DATE(p.created_at)   AS signup_date,
    COUNT(*)::int        AS count
  FROM profiles p
  WHERE p.created_at >= now() - interval '30 days'
  GROUP BY DATE(p.created_at)
  ORDER BY signup_date ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_signup_timeline() TO authenticated;

-- ── 5. Recent error logs ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_recent_error_logs(limit_count int DEFAULT 100)
RETURNS TABLE (
  id          uuid,
  user_email  text,
  error_type  text,
  message     text,
  page        text,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;

  RETURN QUERY
  SELECT e.id, e.user_email, e.error_type, e.message, e.page, e.created_at
  FROM error_logs e
  ORDER BY e.created_at DESC
  LIMIT limit_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_recent_error_logs(int) TO authenticated;
