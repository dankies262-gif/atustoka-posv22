
-- Create profiles table to sync with auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (prevents infinite recursion in policies)
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role = get_user_role(auth.uid()));

-- Trigger to auto-sync new users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'ownerName', NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update stores RLS to also work with profiles
-- Make sure stores table allows inserts from authenticated users
DO $$
BEGIN
  -- Drop existing store policies if they conflict
  DROP POLICY IF EXISTS "Users can manage their own store" ON stores;
  DROP POLICY IF EXISTS "store_select_policy" ON stores;
  DROP POLICY IF EXISTS "store_insert_policy" ON stores;
  DROP POLICY IF EXISTS "store_update_policy" ON stores;
END $$;

CREATE POLICY "store_select_policy" ON stores
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "store_insert_policy" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "store_update_policy" ON stores
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
