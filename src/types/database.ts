// Database types for AtuStoka POS

export interface Store {
  id: string;
  owner_id: string;
  business_name: string;
  business_type: string;
  region: string;
  town?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  product_code?: string;  // auto-generated ATU-XXXXX for items without barcodes
  price: number;
  cost: number;
  stock: number;
  threshold: number;
  category: string;
  supplier?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  email?: string;
  type: 'New' | 'Regular' | 'VIP';
  credit: number;
  credit_limit: number;
  total_spent: number;
  visits: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  current_stock?: number;
  created_at: string;
}

export interface Sale {
  id: string;
  store_id: string;
  customer_id?: string;
  customer_name: string;
  subtotal: number;
  vat: number;
  total: number;
  payment_method: string;
  payment_ref?: string;
  cash_given?: number;
  change?: number;
  cashier_name: string;
  cashier_id?: string;
  status: 'Completed' | 'Returned';
  sale_date: string;
  return_reason?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface Expense {
  id: string;
  store_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  paid_by?: string;
  created_at: string;
}

export interface Staff {
  id: string;
  store_id: string;
  name: string;
  role: string;
  phone?: string | null;
  pin?: string | null;
  shift?: string;
  active: boolean;
  hire_date?: string;
  hired_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  store_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  movement_type: string;
  reference_id?: string;
  reference_type?: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  color: string;
  live: boolean;
}
