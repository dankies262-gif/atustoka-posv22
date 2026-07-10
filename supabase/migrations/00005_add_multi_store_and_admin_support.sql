
-- 1. Add active_store_id to profiles so users can track their active store
ALTER TABLE profiles ADD COLUMN active_store_id uuid REFERENCES stores(id) ON DELETE SET NULL;

-- 2. Enable RLS on stores if not already, and allow users to manage their own stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own stores
CREATE POLICY "Users can view their own stores"
  ON stores FOR SELECT
  USING (owner_id = auth.uid());

-- Allow users to create stores for themselves
CREATE POLICY "Users can create their own stores"
  ON stores FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow users to update their own stores
CREATE POLICY "Users can update their own stores"
  ON stores FOR UPDATE
  USING (owner_id = auth.uid());

-- Allow users to delete their own stores (non-active only enforced in app)
CREATE POLICY "Users can delete their own stores"
  ON stores FOR DELETE
  USING (owner_id = auth.uid());

-- 3. Superadmin can read all profiles (for admin panel)
CREATE POLICY "Superadmin can read all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    OR id = auth.uid()
  );

-- 4. Superadmin can read all stores (for admin panel)
CREATE POLICY "Superadmin can read all stores"
  ON stores FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    OR owner_id = auth.uid()
  );

-- 5. Create a view for admin panel: join profiles + store count + latest store name
CREATE VIEW admin_user_overview AS
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    COUNT(s.id) AS store_count,
    MAX(s.business_name) AS latest_store_name,
    MAX(s.business_type)  AS latest_store_type
  FROM profiles p
  LEFT JOIN stores s ON s.owner_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.role, p.created_at;

-- 6. Allow superadmin to read the view
GRANT SELECT ON admin_user_overview TO authenticated;
