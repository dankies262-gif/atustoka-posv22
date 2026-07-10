-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table (business profiles)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  region TEXT NOT NULL,
  town TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 5,
  category TEXT NOT NULL,
  supplier TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'Regular',
  credit DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  vat DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_ref TEXT,
  cash_given DECIMAL(10,2),
  change DECIMAL(10,2),
  cashier_name TEXT NOT NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sale items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  pin TEXT,
  shift TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_expenses_store_id ON expenses(store_id);
CREATE INDEX idx_staff_store_id ON staff(store_id);
CREATE INDEX idx_stock_movements_store_id ON stock_movements(store_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();