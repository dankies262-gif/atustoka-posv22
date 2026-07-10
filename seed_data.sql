-- Seed data for AtuStoka POS (Run after user registration)
-- Replace 'YOUR_STORE_ID' with actual store ID from stores table

-- Sample Products
INSERT INTO products (store_id, name, sku, barcode, price, cost, stock, threshold, category, supplier, active) VALUES
('YOUR_STORE_ID', 'Windhoek Lager 24pk', 'WHL-024', '6001234000001', 289.99, 210, 48, 12, 'Beer & Cider', 'Namibia Breweries', true),
('YOUR_STORE_ID', 'Tafel Lager 6pk', 'TFL-006', '6001234000002', 79.99, 55, 24, 12, 'Beer & Cider', 'Namibia Breweries', true),
('YOUR_STORE_ID', 'Hunters Gold 6pk', 'HNG-006', '6001234000003', 84.99, 60, 24, 10, 'Beer & Cider', 'Distell Namibia', true),
('YOUR_STORE_ID', 'Coca-Cola 2L', 'CCA-2LT', '5449000131805', 24.99, 16, 60, 20, 'Soft Drinks', 'Namibia Beverages', true),
('YOUR_STORE_ID', 'Camel Cigarettes 20s', 'CML-020', '4002111000005', 49.99, 36, 30, 15, 'Tobacco', 'BAT Namibia', true),
('YOUR_STORE_ID', 'Maize Meal 5kg', 'MZM-005', '6001700024036', 69.99, 48, 35, 10, 'Groceries', 'Namib Mills', true),
('YOUR_STORE_ID', 'Red Bull 250ml', 'RBL-250', '9002490100085', 22.99, 15, 40, 12, 'Energy Drinks', 'Red Bull Namibia', true),
('YOUR_STORE_ID', 'Jagermeister 750ml', 'JAG-750', '4088700100010', 299.99, 210, 8, 3, 'Spirits', 'Metspa Namibia', true),
('YOUR_STORE_ID', 'Castle Lager 6pk', 'CSL-006', '6001234000010', 79.99, 55, 36, 12, 'Beer & Cider', 'Namibia Breweries', true),
('YOUR_STORE_ID', 'Savanna Dry 6pk', 'SAV-006', '6001234000011', 89.99, 62, 24, 10, 'Beer & Cider', 'Distell Namibia', true);

-- Sample Customers
INSERT INTO customers (store_id, name, phone, type, credit, total_spent, visits) VALUES
('YOUR_STORE_ID', 'Piet Nakamura', '0811234567', 'Regular', 0, 2340, 12),
('YOUR_STORE_ID', 'Maria Nghifima', '0851234567', 'Regular', 0, 890, 5),
('YOUR_STORE_ID', 'Tate Shipanga', '0611234567', 'VIP', 0, 5670, 28),
('YOUR_STORE_ID', 'Anna Mutanga', '0812345678', 'New', 0, 0, 0),
('YOUR_STORE_ID', 'John Kavenuka', '0813456789', 'Regular', 150, 1200, 8);

-- Sample Staff
INSERT INTO staff (store_id, name, role, phone, pin, shift, active, hire_date) VALUES
('YOUR_STORE_ID', 'Anna Mutanga', 'Cashier', '0811110001', '1234', 'Morning', true, '2024-01-15'),
('YOUR_STORE_ID', 'John Kavenuka', 'Manager', '0812220002', '5678', 'All Day', true, '2023-06-01'),
('YOUR_STORE_ID', 'Grace Ndapewa', 'Barman', '0813330003', '9012', 'Evening', true, '2024-08-20'),
('YOUR_STORE_ID', 'David Shikongo', 'Cashier', '0814440004', '3456', 'Afternoon', true, '2024-03-10');

-- Sample Expenses
INSERT INTO expenses (store_id, description, amount, category, expense_date, paid_by) VALUES
('YOUR_STORE_ID', 'Electricity – May', 1200, 'Utilities', CURRENT_DATE - INTERVAL '10 days', 'Owner'),
('YOUR_STORE_ID', 'Staff Wages – May', 8500, 'Payroll', CURRENT_DATE - INTERVAL '5 days', 'Owner'),
('YOUR_STORE_ID', 'Rent – May', 3500, 'Rent', CURRENT_DATE - INTERVAL '15 days', 'Owner'),
('YOUR_STORE_ID', 'Delivery Fuel', 450, 'Logistics', CURRENT_DATE - INTERVAL '3 days', 'Manager');

-- Note: To add sample sales, you would need to:
-- 1. Insert into sales table
-- 2. Insert corresponding records into sale_items table
-- 3. Update product stock quantities
-- 4. Update customer total_spent and visits
-- This is best done through the application POS system to ensure data consistency.
