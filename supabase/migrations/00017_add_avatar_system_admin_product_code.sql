-- 1. Profiles: add avatar_url and is_system_admin
ALTER TABLE public.profiles
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN is_system_admin BOOLEAN NOT NULL DEFAULT false;

-- Mark the primary System Administrator
UPDATE public.profiles
SET is_system_admin = true
WHERE email = 'reinholdshilongo@atustoka.com';

-- 2. Products: add product_code for items without barcodes
ALTER TABLE public.products
  ADD COLUMN product_code TEXT;

-- Index for fast lookup by product_code
CREATE INDEX idx_products_product_code ON public.products(product_code);

-- 3. RPC: generate a unique 5-digit admin PIN (not already used by another admin)
CREATE OR REPLACE FUNCTION public.generate_unique_admin_pin()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  candidate TEXT;
  attempts  INT := 0;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    -- ensure PIN is 10000-99999 (always 5 digits)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE admin_pin = crypt(candidate, admin_pin) -- collision check via bcrypt is slow, use plaintext interim store
    ) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique PIN after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 4. RPC: generate unique product code within a store (ATU-XXXXX)
CREATE OR REPLACE FUNCTION public.generate_product_code(p_store_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  candidate TEXT;
  attempts  INT := 0;
BEGIN
  LOOP
    candidate := 'ATU-' || lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.products
      WHERE store_id = p_store_id AND product_code = candidate
    ) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique product code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;