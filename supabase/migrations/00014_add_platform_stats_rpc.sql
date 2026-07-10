
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users',    (SELECT COUNT(*)::int FROM profiles),
    'total_stores',   (SELECT COUNT(*)::int FROM stores),
    'total_sales',    (SELECT COUNT(*)::int FROM sales),
    'total_products', (SELECT COUNT(*)::int FROM products),
    'errors_today',   (SELECT COUNT(*)::int FROM error_logs
                        WHERE created_at >= NOW() - INTERVAL '1 day'),
    'new_today',      (SELECT COUNT(*)::int FROM profiles
                        WHERE created_at >= NOW() - INTERVAL '1 day'),
    'new_this_week',  (SELECT COUNT(*)::int FROM profiles
                        WHERE created_at >= NOW() - INTERVAL '7 days')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
