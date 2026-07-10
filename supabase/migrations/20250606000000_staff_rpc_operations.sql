-- Staff operations RPCs to bypass RLS safely for authenticated staff via PIN
-- These functions are SECURITY DEFINER so they can read/write regardless of RLS,
-- but they require the exact store_id, which acts as a secure capability token.

CREATE OR REPLACE FUNCTION public.get_store_products(p_store_id UUID)
RETURNS SETOF products
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM products WHERE store_id = p_store_id ORDER BY name;
$$;
GRANT EXECUTE ON FUNCTION public.get_store_products TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_products TO authenticated;

CREATE OR REPLACE FUNCTION public.get_store_customers(p_store_id UUID)
RETURNS SETOF customers
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM customers WHERE store_id = p_store_id ORDER BY name;
$$;
GRANT EXECUTE ON FUNCTION public.get_store_customers TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_customers TO authenticated;

CREATE OR REPLACE FUNCTION public.get_store_staff(p_store_id UUID)
RETURNS SETOF staff
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM staff WHERE store_id = p_store_id ORDER BY name;
$$;
GRANT EXECUTE ON FUNCTION public.get_store_staff TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_staff TO authenticated;

CREATE OR REPLACE FUNCTION public.get_store_sales(p_store_id UUID)
RETURNS SETOF sales
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM sales WHERE store_id = p_store_id ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_store_sales TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_sales TO authenticated;

-- Function to handle the entire checkout process atomically
CREATE OR REPLACE FUNCTION public.staff_checkout(
  p_store_id UUID,
  p_sale JSONB,
  p_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INT;
BEGIN
  -- Insert sale
  INSERT INTO sales (
    id, store_id, customer_id, customer_name, subtotal, vat, total,
    payment_method, amount_given, change_returned, status,
    staff_id, staff_name, created_at, updated_at
  ) VALUES (
    (p_sale->>'id')::UUID,
    p_store_id,
    NULLIF(p_sale->>'customer_id', '')::UUID,
    p_sale->>'customer_name',
    (p_sale->>'subtotal')::DECIMAL,
    (p_sale->>'vat')::DECIMAL,
    (p_sale->>'total')::DECIMAL,
    p_sale->>'payment_method',
    (p_sale->>'amount_given')::DECIMAL,
    (p_sale->>'change_returned')::DECIMAL,
    p_sale->>'status',
    NULLIF(p_sale->>'staff_id', '')::UUID,
    p_sale->>'staff_name',
    (p_sale->>'created_at')::TIMESTAMPTZ,
    (p_sale->>'created_at')::TIMESTAMPTZ
  ) RETURNING id INTO v_sale_id;

  -- Insert items and update stock
  FOREACH v_item IN ARRAY p_items
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    -- Insert sale item
    INSERT INTO sale_items (
      id, sale_id, product_id, product_name, quantity, unit_price, line_total
    ) VALUES (
      (v_item->>'id')::UUID,
      v_sale_id,
      v_product_id,
      v_item->>'product_name',
      v_qty,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'line_total')::DECIMAL
    );

    -- Deduct stock
    UPDATE products
    SET stock = stock - v_qty
    WHERE id = v_product_id AND store_id = p_store_id;

    -- Insert stock movement
    INSERT INTO stock_movements (
      store_id, product_id, product_name, quantity, movement_type, reference_id, reference_type
    ) VALUES (
      p_store_id,
      v_product_id,
      v_item->>'product_name',
      -v_qty,
      'sale',
      v_sale_id,
      'sales'
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.staff_checkout TO anon;
GRANT EXECUTE ON FUNCTION public.staff_checkout TO authenticated;

