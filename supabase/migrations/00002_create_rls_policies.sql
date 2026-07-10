-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's store_id
CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
  SELECT id FROM stores WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user owns store
CREATE OR REPLACE FUNCTION user_owns_store(store_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores WHERE id = store_uuid AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Stores policies
CREATE POLICY "Users can view their own store"
  ON stores FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own store"
  ON stores FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own store"
  ON stores FOR UPDATE
  USING (owner_id = auth.uid());

-- Products policies
CREATE POLICY "Users can view their store products"
  ON products FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert products to their store"
  ON products FOR INSERT
  WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Users can update their store products"
  ON products FOR UPDATE
  USING (user_owns_store(store_id));

CREATE POLICY "Users can delete their store products"
  ON products FOR DELETE
  USING (user_owns_store(store_id));

-- Customers policies
CREATE POLICY "Users can view their store customers"
  ON customers FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert customers to their store"
  ON customers FOR INSERT
  WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Users can update their store customers"
  ON customers FOR UPDATE
  USING (user_owns_store(store_id));

CREATE POLICY "Users can delete their store customers"
  ON customers FOR DELETE
  USING (user_owns_store(store_id));

-- Sales policies
CREATE POLICY "Users can view their store sales"
  ON sales FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert sales to their store"
  ON sales FOR INSERT
  WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Users can update their store sales"
  ON sales FOR UPDATE
  USING (user_owns_store(store_id));

-- Sale items policies
CREATE POLICY "Users can view sale items from their store"
  ON sale_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND user_owns_store(sales.store_id)
  ));

CREATE POLICY "Users can insert sale items to their store"
  ON sale_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND user_owns_store(sales.store_id)
  ));

-- Expenses policies
CREATE POLICY "Users can view their store expenses"
  ON expenses FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert expenses to their store"
  ON expenses FOR INSERT
  WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Users can update their store expenses"
  ON expenses FOR UPDATE
  USING (user_owns_store(store_id));

CREATE POLICY "Users can delete their store expenses"
  ON expenses FOR DELETE
  USING (user_owns_store(store_id));

-- Staff policies
CREATE POLICY "Users can view their store staff"
  ON staff FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert staff to their store"
  ON staff FOR INSERT
  WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Users can update their store staff"
  ON staff FOR UPDATE
  USING (user_owns_store(store_id));

CREATE POLICY "Users can delete their store staff"
  ON staff FOR DELETE
  USING (user_owns_store(store_id));

-- Stock movements policies
CREATE POLICY "Users can view their store stock movements"
  ON stock_movements FOR SELECT
  USING (user_owns_store(store_id));

CREATE POLICY "Users can insert stock movements to their store"
  ON stock_movements FOR INSERT
  WITH CHECK (user_owns_store(store_id));