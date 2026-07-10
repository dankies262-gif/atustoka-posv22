
DROP FUNCTION IF EXISTS public.get_admin_user_overview();
DROP FUNCTION IF EXISTS public.get_admin_stores_overview();
DROP FUNCTION IF EXISTS public.get_signup_timeline();
DROP FUNCTION IF EXISTS public.get_recent_error_logs(int);

-- ── Helper: is the calling user a superadmin? ────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- ── 2. User overview ──────────────────────────────────────────────────────────
CREATE FUNCTION public.get_admin_user_overview()
RETURNS TABLE (
  usr_id            uuid,
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
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;
  RETURN QUERY
  SELECT
    p.id                         AS usr_id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    COUNT(s.id)::int             AS store_count,
    MAX(s.business_name)         AS latest_store_name,
    MAX(s.business_type)         AS latest_store_type
  FROM profiles p
  LEFT JOIN stores s ON s.owner_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.role, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_user_overview() TO authenticated;

-- ── 3. Stores overview ────────────────────────────────────────────────────────
CREATE FUNCTION public.get_admin_stores_overview()
RETURNS TABLE (
  store_id      uuid,
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
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;
  RETURN QUERY
  SELECT
    st.id             AS store_id,
    st.business_name,
    st.business_type,
    st.region,
    p.email           AS owner_email,
    p.full_name       AS owner_name,
    st.created_at
  FROM stores st
  LEFT JOIN profiles p ON p.id = st.owner_id
  ORDER BY st.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_stores_overview() TO authenticated;

-- ── 4. Signup timeline ────────────────────────────────────────────────────────
CREATE FUNCTION public.get_signup_timeline()
RETURNS TABLE (
  signup_date date,
  cnt         int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;
  RETURN QUERY
  SELECT
    DATE(p.created_at)  AS signup_date,
    COUNT(*)::int       AS cnt
  FROM profiles p
  WHERE p.created_at >= now() - interval '30 days'
  GROUP BY DATE(p.created_at)
  ORDER BY signup_date ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_signup_timeline() TO authenticated;

-- ── 5. Recent error logs ──────────────────────────────────────────────────────
CREATE FUNCTION public.get_recent_error_logs(limit_count int DEFAULT 100)
RETURNS TABLE (
  log_id      uuid,
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
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied — superadmin only';
  END IF;
  RETURN QUERY
  SELECT
    e.id          AS log_id,
    e.user_email,
    e.error_type,
    e.message,
    e.page,
    e.created_at
  FROM error_logs e
  ORDER BY e.created_at DESC
  LIMIT limit_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_recent_error_logs(int) TO authenticated;
