// Database service functions for AtuStoka POS
import { supabase } from '@/db/supabase';
import { getLocalCache, setLocalCache, updateLocalCacheItem, queueAction, triggerSync } from './offline';
import type {
  Store,
  Product,
  Customer,
  Sale,
  SaleItem,
  Expense,
  Staff,
  StockMovement,
} from '@/types/database';

// ── Store operations ──────────────────────────────────────────────────────────

export async function getStore(): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) { console.error('getStore:', error); return null; }
  return data;
}

export async function createStore(
  store: Omit<Store, 'id' | 'created_at' | 'updated_at'>
): Promise<{ ok: boolean; id?: string; error?: string }> {
  // Insert then re-fetch the new row by matching owner+name+type to get the id
  const { error } = await supabase.from('stores').insert({
    owner_id: store.owner_id,
    business_name: store.business_name,
    business_type: store.business_type,
    region: store.region,
    town: store.town ?? null,
    phone: store.phone ?? null,
  });
  if (error) {
    console.error('createStore error:', error.code, error.message, error.details);
    return { ok: false, error: error.message };
  }
  // Fetch the id of the just-created store
  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', store.owner_id)
    .eq('business_name', store.business_name)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { ok: true, id: data?.id };
}

export async function updateStore(
  id: string,
  updates: Partial<Omit<Store, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id);
  if (error) {
    console.error('updateStore error:', error.code, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteStore(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) {
    console.error('deleteStore error:', error.code, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Product operations ────────────────────────────────────────────────────────

export async function getProducts(storeId?: string): Promise<Product[]> {
  if (!navigator.onLine) {
    return getLocalCache<Product>('products', storeId);
  }

  let data, error;
  if (storeId) {
    const res = await supabase.rpc('get_store_products', { p_store_id: storeId });
    data = res.data?.filter((p: any) => p.active === true);
    error = res.error;
  } else {
    const res = await supabase.from('products').select('*').eq('active', true).order('name');
    data = res.data;
    error = res.error;
  }
  
  if (error) { console.error('getProducts:', error); return getLocalCache<Product>('products', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('products', results, storeId);
  return results;
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product | null> {
  const id = crypto.randomUUID();
  const newProduct = { ...product, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Product;

  if (!navigator.onLine) {
    queueAction({ table: 'products', operation: 'INSERT', payload: newProduct });
    updateLocalCacheItem('products', id, newProduct, product.store_id);
    return newProduct;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(newProduct)
    .select()
    .single();
  if (error) { console.error('createProduct:', error); return null; }
  
  updateLocalCacheItem('products', data.id, data, product.store_id);
  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const cache = getLocalCache<Product>('products');
  const existing = cache.find(p => p.id === id);
  const updatedData = existing ? { ...existing, ...updates, updated_at: new Date().toISOString() } : null;

  if (!navigator.onLine) {
    queueAction({ table: 'products', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('products', id, updatedData, existing?.store_id);
    return updatedData;
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) { 
    console.error('updateProduct online error, falling back to queue:', error);
    queueAction({ table: 'products', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('products', id, updatedData, existing?.store_id);
    return updatedData;
  }
  
  updateLocalCacheItem('products', id, data, data.store_id);
  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const cache = getLocalCache<Product>('products');
  const existing = cache.find(p => p.id === id);

  if (!navigator.onLine) {
    queueAction({ table: 'products', operation: 'UPDATE', payload: { active: false }, matchField: 'id', matchValue: id });
    if (existing) updateLocalCacheItem('products', id, { ...existing, active: false }, existing.store_id);
    return true;
  }

  const { error } = await supabase
    .from('products')
    .update({ active: false })
    .eq('id', id);
  if (error) { console.error('deleteProduct:', error); return false; }
  
  if (existing) updateLocalCacheItem('products', id, { ...existing, active: false }, existing.store_id);
  return true;
}

// ── Customer operations ───────────────────────────────────────────────────────

export async function getCustomers(storeId?: string): Promise<Customer[]> {
  if (!navigator.onLine) return getLocalCache<Customer>('customers', storeId);

  let data, error;
  if (storeId) {
    const res = await supabase.rpc('get_store_customers', { p_store_id: storeId });
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase.from('customers').select('*').order('name');
    data = res.data;
    error = res.error;
  }

  if (error) { console.error('getCustomers:', error); return getLocalCache<Customer>('customers', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('customers', results, storeId);
  return results;
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
): Promise<Customer | null> {
  const id = crypto.randomUUID();
  const newCustomer = { ...customer, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Customer;

  if (!navigator.onLine) {
    queueAction({ table: 'customers', operation: 'INSERT', payload: newCustomer });
    updateLocalCacheItem('customers', id, newCustomer, customer.store_id);
    return newCustomer;
  }

  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();
  if (error) { console.error('createCustomer:', error); return null; }
  
  updateLocalCacheItem('customers', data.id, data, customer.store_id);
  return data;
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  const cache = getLocalCache<Customer>('customers');
  const existing = cache.find(c => c.id === id);
  const updatedData = existing ? { ...existing, ...updates, updated_at: new Date().toISOString() } : null;

  if (!navigator.onLine) {
    queueAction({ table: 'customers', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('customers', id, updatedData, existing?.store_id);
    return updatedData;
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) { 
    queueAction({ table: 'customers', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('customers', id, updatedData, existing?.store_id);
    return updatedData;
  }
  
  updateLocalCacheItem('customers', data.id, data, data.store_id);
  return data;
}

// ── Sales operations ──────────────────────────────────────────────────────────

export async function getSales(storeId?: string): Promise<Sale[]> {
  if (!navigator.onLine) return getLocalCache<Sale>('sales', storeId);

  const { data: { session } } = await supabase.auth.getSession();
  let data, error;

  if (storeId && !session) {
    const res = await supabase.rpc('get_store_sales', { p_store_id: storeId });
    data = res.data;
    error = res.error;
  } else {
    let q = supabase
      .from('sales')
      .select('*, items:sale_items(*)')
      .order('created_at', { ascending: false });
    if (storeId) q = q.eq('store_id', storeId);
    const res = await q;
    data = res.data;
    error = res.error;
  }

  if (error) { console.error('getSales:', error); return getLocalCache<Sale>('sales', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('sales', results, storeId);
  return results;
}

export async function updateSale(
  id: string,
  updates: Partial<Sale>
): Promise<Sale | null> {
  const cache = getLocalCache<Sale>('sales');
  const existing = cache.find(s => s.id === id);
  const updatedData = existing ? { ...existing, ...updates } : null;

  if (!navigator.onLine) {
    queueAction({ table: 'sales', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('sales', id, updatedData, existing?.store_id);
    return updatedData;
  }

  const { data, error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) { 
    queueAction({ table: 'sales', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('sales', id, updatedData, existing?.store_id);
    return updatedData;
  }
  
  // Need to preserve items in cache since update response doesn't include them
  const finalData = existing ? { ...existing, ...data } : data;
  updateLocalCacheItem('sales', data.id, finalData, data.store_id);
  return finalData;
}

export async function createSale(
  sale: Omit<Sale, 'id' | 'created_at'>,
  items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]
): Promise<Sale | null> {
  const saleId = crypto.randomUUID();
  const newSale = { ...sale, id: saleId, created_at: new Date().toISOString() } as Sale;
  
  const saleItems = items.map(item => ({ 
    ...item, 
    id: crypto.randomUUID(), 
    sale_id: saleId, 
    created_at: new Date().toISOString() 
  })) as SaleItem[];

  if (!navigator.onLine) {
    queueAction({ table: 'sales', operation: 'INSERT', payload: newSale });
    queueAction({ table: 'sale_items', operation: 'INSERT', payload: saleItems });
    
    const cachedSale = { ...newSale, items: saleItems };
    updateLocalCacheItem('sales', saleId, cachedSale, sale.store_id);
    return cachedSale;
  }

  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert(newSale)
    .select()
    .single();
  if (saleError) { 
    console.error('createSale online error, falling back:', saleError); 
    queueAction({ table: 'sales', operation: 'INSERT', payload: newSale });
    queueAction({ table: 'sale_items', operation: 'INSERT', payload: saleItems });
    const cachedSale = { ...newSale, items: saleItems };
    updateLocalCacheItem('sales', saleId, cachedSale, sale.store_id);
    return cachedSale;
  }

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
  if (itemsError) console.error('createSaleItems:', itemsError);

  const finalSale = { ...saleData, items: saleItems };
  updateLocalCacheItem('sales', saleId, finalSale, sale.store_id);
  return finalSale;
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId);
  if (error) { console.error('getSaleItems:', error); return []; }
  return Array.isArray(data) ? data : [];
}

// ── Expense operations ────────────────────────────────────────────────────────

export async function getExpenses(storeId?: string): Promise<Expense[]> {
  if (!navigator.onLine) return getLocalCache<Expense>('expenses', storeId);

  let q = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
  if (storeId) q = q.eq('store_id', storeId);
  const { data, error } = await q;
  if (error) { console.error('getExpenses:', error); return getLocalCache<Expense>('expenses', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('expenses', results, storeId);
  return results;
}

export async function createExpense(
  expense: Omit<Expense, 'id' | 'created_at'>
): Promise<Expense | null> {
  const id = crypto.randomUUID();
  const newExpense = { ...expense, id, created_at: new Date().toISOString() } as Expense;

  if (!navigator.onLine) {
    queueAction({ table: 'expenses', operation: 'INSERT', payload: newExpense });
    updateLocalCacheItem('expenses', id, newExpense, expense.store_id);
    return newExpense;
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert(newExpense)
    .select()
    .single();
  if (error) { console.error('createExpense:', error); return null; }
  
  updateLocalCacheItem('expenses', data.id, data, expense.store_id);
  return data;
}

// ── Staff operations ──────────────────────────────────────────────────────────

export async function getStaff(storeId?: string): Promise<Staff[]> {
  if (!navigator.onLine) return getLocalCache<Staff>('staff', storeId);

  let data, error;
  if (storeId) {
    const res = await supabase.rpc('get_store_staff', { p_store_id: storeId });
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase.from('staff').select('*').order('name');
    data = res.data;
    error = res.error;
  }

  if (error) { console.error('getStaff:', error); return getLocalCache<Staff>('staff', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('staff', results, storeId);
  return results;
}

export async function createStaff(
  staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
): Promise<Staff | null> {
  const id = crypto.randomUUID();
  const newStaff = { ...staff, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Staff;

  if (!navigator.onLine) {
    queueAction({ table: 'staff', operation: 'INSERT', payload: newStaff });
    updateLocalCacheItem('staff', id, newStaff, staff.store_id);
    return newStaff;
  }

  const { data, error } = await supabase
    .from('staff')
    .insert(newStaff)
    .select()
    .single();
  if (error) { console.error('createStaff:', error); return null; }
  
  updateLocalCacheItem('staff', data.id, data, staff.store_id);
  return data;
}

export async function updateStaff(
  id: string,
  updates: Partial<Staff>
): Promise<Staff | null> {
  const cache = getLocalCache<Staff>('staff');
  const existing = cache.find(s => s.id === id);
  const updatedData = existing ? { ...existing, ...updates, updated_at: new Date().toISOString() } : null;

  if (!navigator.onLine) {
    queueAction({ table: 'staff', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('staff', id, updatedData, existing?.store_id);
    return updatedData;
  }

  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) { 
    queueAction({ table: 'staff', operation: 'UPDATE', payload: updates, matchField: 'id', matchValue: id });
    if (updatedData) updateLocalCacheItem('staff', id, updatedData, existing?.store_id);
    return updatedData;
  }
  
  updateLocalCacheItem('staff', data.id, data, data.store_id);
  return data;
}

// ── Stock movement operations ─────────────────────────────────────────────────

export async function getStockMovements(storeId?: string): Promise<StockMovement[]> {
  if (!navigator.onLine) return getLocalCache<StockMovement>('stock_movements', storeId);

  let q = supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false });
  if (storeId) q = q.eq('store_id', storeId);
  const { data, error } = await q;
  if (error) { console.error('getStockMovements:', error); return getLocalCache<StockMovement>('stock_movements', storeId); }
  
  const results = Array.isArray(data) ? data : [];
  setLocalCache('stock_movements', results, storeId);
  return results;
}

export async function createStockMovement(
  movement: Omit<StockMovement, 'id' | 'created_at'>
): Promise<StockMovement | null> {
  const id = crypto.randomUUID();
  const newMovement = { ...movement, id, created_at: new Date().toISOString() } as StockMovement;

  if (!navigator.onLine) {
    queueAction({ table: 'stock_movements', operation: 'INSERT', payload: newMovement });
    updateLocalCacheItem('stock_movements', id, newMovement, movement.store_id);
    return newMovement;
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(newMovement)
    .select()
    .single();
  if (error) { console.error('createStockMovement:', error); return null; }
  
  updateLocalCacheItem('stock_movements', data.id, data, movement.store_id);
  return data;
}

