
-- Drop the old duplicate policies, keep only the clearly-named ones
DROP POLICY IF EXISTS "Users can create their own stores"   ON stores;
DROP POLICY IF EXISTS "Users can insert their own store"   ON stores;
DROP POLICY IF EXISTS "Users can view their own store"     ON stores;
DROP POLICY IF EXISTS "Users can view their own stores"    ON stores;
DROP POLICY IF EXISTS "Users can update their own store"   ON stores;
DROP POLICY IF EXISTS "Users can update their own stores"  ON stores;
DROP POLICY IF EXISTS "Users can delete their own stores"  ON stores;
DROP POLICY IF EXISTS "Superadmin can read all stores"     ON stores;

-- Also drop the old generic-named ones
DROP POLICY IF EXISTS "store_insert_policy"  ON stores;
DROP POLICY IF EXISTS "store_select_policy"  ON stores;
DROP POLICY IF EXISTS "store_update_policy"  ON stores;

-- Recreate a clean, minimal set
CREATE POLICY "stores_select" ON stores
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR is_superadmin()
);

CREATE POLICY "stores_insert" ON stores
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "stores_update" ON stores
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "stores_delete" ON stores
FOR DELETE TO authenticated
USING (owner_id = auth.uid());
