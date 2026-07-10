
-- ── Helper: can the given user be promoted to superadmin? ────────────────────
CREATE OR REPLACE FUNCTION public.can_promote_to_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM profiles WHERE role = 'superadmin') < 5;
$$;

GRANT EXECUTE ON FUNCTION public.can_promote_to_superadmin() TO authenticated;

-- ── RPC: safe promote/demote with 5-admin cap ─────────────────────────────────
-- Only existing superadmins may call this.
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_target_user_id uuid,
  p_new_role        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_admin_count int;
BEGIN
  -- Verify caller is superadmin
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'superadmin' THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  -- Enforce 5-admin cap when promoting
  IF p_new_role = 'superadmin' THEN
    SELECT COUNT(*) INTO v_admin_count FROM profiles WHERE role = 'superadmin';
    IF v_admin_count >= 5 THEN
      RETURN jsonb_build_object('error', 'max_admins_reached', 'count', v_admin_count);
    END IF;
  END IF;

  -- Apply role change
  UPDATE profiles SET role = p_new_role WHERE id = p_target_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- ── RPC: get current superadmin count (for UI display) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_superadmin_count()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM profiles WHERE role = 'superadmin';
$$;

GRANT EXECUTE ON FUNCTION public.get_superadmin_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_superadmin_count() TO anon;
