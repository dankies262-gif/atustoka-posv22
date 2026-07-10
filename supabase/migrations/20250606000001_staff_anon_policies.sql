-- Allow anonymous users (staff PIN sessions) to perform necessary POS operations
-- Security relies on the unguessable nature of UUIDs (store_id, product_id)

-- Products: Staff can update stock levels after a sale
CREATE POLICY "Anon can update store products"
  ON products FOR UPDATE TO anon
  USING (true);

-- Customers: Staff can create new walk-in customers or update their details
CREATE POLICY "Anon can insert customers"
  ON customers FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "Anon can update customers"
  ON customers FOR UPDATE TO anon
  USING (true);

-- Sales: Staff can record new sales
CREATE POLICY "Anon can insert sales to store"
  ON sales FOR INSERT TO anon
  WITH CHECK (true);

-- Sale items: Staff can record items sold
CREATE POLICY "Anon can insert sale items to store"
  ON sale_items FOR INSERT TO anon
  WITH CHECK (true);

-- Stock movements: Staff can log stock deductions
CREATE POLICY "Anon can insert stock movements"
  ON stock_movements FOR INSERT TO anon
  WITH CHECK (true);

