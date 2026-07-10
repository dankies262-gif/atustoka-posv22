
-- Promote linekelakaboy@gmail.com (Kaboy) to superadmin
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'linekelakaboy@gmail.com';

-- Verify all 4 accounts now show correct roles
DO $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM profiles WHERE role = 'superadmin';
  IF cnt < 3 THEN
    RAISE EXCEPTION 'Expected at least 3 superadmins, found %', cnt;
  END IF;
END $$;
