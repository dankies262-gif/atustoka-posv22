-- ── 1. Add subscription_expires_at to profiles ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN subscription_expires_at timestamptz DEFAULT NULL;

-- ── 2. Add subscription_expires_at to stores (per-store context) ────────────
ALTER TABLE public.stores
  ADD COLUMN subscription_expires_at timestamptz DEFAULT NULL;

-- ── 3. Set every existing owner profile expiry = created_at + 3 months ───────
UPDATE public.profiles
SET subscription_expires_at = created_at + INTERVAL '3 months'
WHERE role = 'owner' OR role IS NULL;

-- ── 4. Set matching store-level expiry ────────────────────────────────────────
UPDATE public.stores s
SET subscription_expires_at = p.subscription_expires_at
FROM public.profiles p
WHERE s.owner_id = p.id;

-- ── 5. Auto-deactivate function: called by cron or on-login check ─────────────
CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_owners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired owners inactive in profiles
  UPDATE public.profiles
  SET is_active = false
  WHERE role = 'owner'
    AND is_active = true
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < NOW();
END;
$$;

-- ── 6. Helper: check if current user's subscription is active ─────────────────
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN role = 'superadmin' THEN true   -- admins never expire
    WHEN is_active = false    THEN false  -- explicitly deactivated
    WHEN subscription_expires_at IS NULL THEN true  -- no expiry = active
    ELSE subscription_expires_at > NOW()
  END
  FROM public.profiles
  WHERE id = p_user_id;
$$;

-- ── 7. Trigger: when a new owner profile is inserted, set 3-month expiry ──────
CREATE OR REPLACE FUNCTION public.set_owner_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'owner' AND NEW.subscription_expires_at IS NULL THEN
    NEW.subscription_expires_at := NEW.created_at + INTERVAL '3 months';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_owner_subscription_expiry
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_owner_subscription_expiry();

-- ── 8. Trigger: when a store is inserted, copy owner's expiry ─────────────────
CREATE OR REPLACE FUNCTION public.set_store_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  SELECT subscription_expires_at
  INTO NEW.subscription_expires_at
  FROM public.profiles
  WHERE id = NEW.owner_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_store_subscription_expiry
BEFORE INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.set_store_subscription_expiry();

-- Enable realtime for profiles so subscription changes reflect live
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;