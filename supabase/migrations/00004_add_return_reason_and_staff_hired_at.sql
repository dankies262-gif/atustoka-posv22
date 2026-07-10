
-- Add return_reason to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS return_reason text;

-- Ensure staff has hired_at alias (some schemas use hire_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'hired_at'
  ) THEN
    ALTER TABLE staff ADD COLUMN hired_at timestamptz DEFAULT now();
  END IF;
END $$;
