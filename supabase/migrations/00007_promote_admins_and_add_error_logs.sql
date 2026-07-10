
-- Promote both real administrator accounts to superadmin
UPDATE profiles SET role = 'superadmin'
WHERE email IN ('dankies262@gmail.com', 'dankies942@gmail.com');

-- Error logs table for admin troubleshooting
CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email  text,
  store_id    uuid REFERENCES stores(id) ON DELETE SET NULL,
  error_type  text NOT NULL DEFAULT 'client_error',
  message     text NOT NULL,
  stack       text,
  page        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert their own error
CREATE POLICY "Users can insert error logs" ON error_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Superadmins can read all error logs
CREATE POLICY "Superadmin can read all error logs" ON error_logs
FOR SELECT TO authenticated
USING (is_superadmin());

-- Index for fast queries
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx ON error_logs(user_id);

-- Enable realtime for error_logs
ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;

-- Update get_platform_stats to include error count and signup trend
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_users        int;
  v_stores       int;
  v_sales        int;
  v_products     int;
  v_errors_today int;
  v_new_today    int;
  v_new_week     int;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*)::int INTO v_users    FROM profiles;
  SELECT COUNT(*)::int INTO v_stores   FROM stores;
  SELECT COUNT(*)::int INTO v_sales    FROM sales;
  SELECT COUNT(*)::int INTO v_products FROM products WHERE active = true;
  SELECT COUNT(*)::int INTO v_errors_today FROM error_logs WHERE created_at >= current_date;
  SELECT COUNT(*)::int INTO v_new_today FROM profiles WHERE created_at >= current_date;
  SELECT COUNT(*)::int INTO v_new_week  FROM profiles WHERE created_at >= current_date - interval '7 days';

  RETURN json_build_object(
    'total_users',    v_users,
    'total_stores',   v_stores,
    'total_sales',    v_sales,
    'total_products', v_products,
    'errors_today',   v_errors_today,
    'new_today',      v_new_today,
    'new_this_week',  v_new_week
  );
END;
$$;

-- Signup timeline function: last 30 days by day
CREATE OR REPLACE FUNCTION get_signup_timeline()
RETURNS TABLE(signup_date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    DATE(p.created_at) AS signup_date,
    COUNT(*)            AS count
  FROM profiles p
  WHERE p.created_at >= now() - interval '30 days'
  GROUP BY DATE(p.created_at)
  ORDER BY signup_date ASC;
END;
$$;

-- Get recent error logs (last 100)
CREATE OR REPLACE FUNCTION get_recent_error_logs(limit_count int DEFAULT 100)
RETURNS TABLE(
  id         uuid,
  user_email text,
  error_type text,
  message    text,
  page       text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT e.id, e.user_email, e.error_type, e.message, e.page, e.created_at
  FROM error_logs e
  ORDER BY e.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_signup_timeline()          TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_error_logs(int)     TO authenticated;
