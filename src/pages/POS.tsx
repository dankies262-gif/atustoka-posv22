import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ScanLine, Trash2, Plus, Minus, X, ChevronLeft, CheckCircle2, Printer, Loader2, Package, UserCircle2, LogOut, PackagePlus, Tag, TrendingUp, Banknote, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { getProducts, createProduct, createSale, updateProduct, createStockMovement, updateCustomer, getCustomers, getStaff, getSales, createCustomer } from '@/services/database';
import { formatCurrency, calculateVAT, calculateTotal, getTodayISO } from '@/lib/format';
import { PAYMENT_METHODS, CATEGORIES, PAYMENT_INSTRUCTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { STAFF_SESSION_KEY } from '@/pages/auth/Login';
import type { Product, CartItem, Customer, Staff, Sale } from '@/types/database';

type Screen = 'pos' | 'payment' | 'receipt';

interface ReceiptData {
  id: string;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  method: string;
  cashGiven?: number;
  change?: number;
  ref?: string;
  customer: string;
  date: string;
}

export default function POS() {
  const { user, store } = useAuth();
  const navigate = useNavigate();

  // Derive store_id: prefer auth context, fall back to staff PIN session
  const staffSession = (() => {
    try {
      const raw = localStorage.getItem(STAFF_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const effectiveStoreId: string | undefined = store?.id ?? staffSession?.store?.id;
  const isStaffOnlySession = !user && !!staffSession?.staff;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>('pos');
  const [showScanner, setShowScanner] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [staffPinTarget, setStaffPinTarget] = useState<Staff | null>(null);
  const [customerName, setCustomerName] = useState('Walk-in');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustSaving, setNewCustSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [payRef, setPayRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Quick-add product from POS (for barcode-less items like eggs, apples, etc.)
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaName, setQaName]     = useState('');
  const [qaPrice, setQaPrice]   = useState('');
  const [qaStock, setQaStock]   = useState('10');
  const [qaCat, setQaCat]       = useState('Other');
  const [qaBarcode, setQaBarcode] = useState('');
  const [qaSaving, setQaSaving] = useState(false);

  // Scan not found dialog
  const [scanNotFoundCode, setScanNotFoundCode] = useState<string | null>(null);

  // Staff can only view the POS, not add products
  // isStaffOnlySession is already derived below from !user && !!staffSession?.staff

  useEffect(() => {
    getProducts(effectiveStoreId).then(setProducts);
    getCustomers(effectiveStoreId).then(setCustomers);
    getStaff(effectiveStoreId).then(setStaffList);
    // Load today's sales for the revenue bar
    getSales(effectiveStoreId).then((sales) => {
      const today = getTodayISO();
      setTodaySales(sales.filter((s) => s.sale_date?.startsWith(today)));
    });
    // Auto-activate staff member who signed in via the staff PIN login screen
    if (staffSession?.staff) {
      setActiveStaff(staffSession.staff as Staff);
    }
  }, [effectiveStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStaffLogout = () => {
    localStorage.removeItem(STAFF_SESSION_KEY);
    navigate('/login');
  };

  const [customerSearch, setCustomerSearch] = useState('');

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.product_code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = useCallback((product: Product) => {
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast.error('Not enough stock'); return prev; }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.stock)) } : i)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => { setCart([]); setCustomerName('Walk-in'); setSelectedCustomer(null); };

  const sum = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const total = calculateTotal(sum);
  const vat = calculateVAT(total);
  const subtotal = total - vat;
  const change = selectedMethod === 'cash' ? Math.max(0, Number(cashGiven) - total) : 0;
  
  // For split payment, credit portion is whatever cash didn't cover
  const splitCreditPortion = selectedMethod === 'split' ? Math.max(0, total - Number(cashGiven)) : 0;

  const handleScan = useCallback((code: string) => {
    setShowScanner(false);
    const p = products.find((pr) => pr.barcode === code || pr.sku === code);
    if (p) { 
      addToCart(p); 
      toast.success(`Added: ${p.name}`); 
    } else { 
      setSearch(code); 
      if (isStaffOnlySession) {
        toast.info('Product not found — search populated'); 
      } else {
        setScanNotFoundCode(code);
      }
    }
  }, [products, isStaffOnlySession]);
  // Global physical barcode scanner listener
  useEffect(() => {
    // Disable scanner if we're not on the main POS screen or if dialogs are open
    if (screen !== 'pos' || showScanner || showQuickAdd || scanNotFoundCode || showStaffPicker || showMobileCart) return;

    let barcodeBuffer = '';
    let lastKeyTime = Date.now();
    let scanTimeout: NodeJS.Timeout;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if currently typing in an input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      if (isInputFocused) return;

      const currentTime = Date.now();
      
      // If time between keystrokes is > 50ms, it's likely a human typing, not a scanner.
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = ''; 
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault();
          const code = barcodeBuffer;
          barcodeBuffer = '';
          
          const p = products.find((pr) => pr.barcode === code || pr.sku === code || pr.product_code === code);
          if (p) {
            addToCart(p);
            toast.success(`Added: ${p.name}`);
            setSearch(''); // Clear search just in case
          } else {
            if (isStaffOnlySession) {
              toast.error('Product not found in inventory');
            } else {
              setScanNotFoundCode(code);
            }
          }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(scanTimeout);
    };
  }, [screen, showScanner, showQuickAdd, scanNotFoundCode, showStaffPicker, showMobileCart, products, isStaffOnlySession, addToCart]);


  const handleAddCustomer = async () => {
    if (!newCustName.trim()) { toast.error('Customer name is required'); return; }
    if (!effectiveStoreId) { toast.error('Store not found'); return; }
    
    setNewCustSaving(true);
    try {
      const created = await createCustomer({
        store_id: effectiveStoreId,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        email: undefined,
        type: 'New',
        credit: 0,
        credit_limit: 0,
        total_spent: 0,
        visits: 0
      });
      if (!created) throw new Error('Failed to create customer');
      
      const updated = await getCustomers(effectiveStoreId);
      setCustomers(updated);
      setSelectedCustomer(created);
      setCustomerName(created.name);
      toast.success('Customer added');
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (e: any) {
      toast.error(e.message || 'Error adding customer');
    } finally {
      setNewCustSaving(false);
    }
  };

  // Quick-add a new product directly from POS (auto-generates product code, adds to cart)
  const handleQuickAdd = async () => {
    if (!qaName.trim())   { toast.error('Product name is required'); return; }
    const price = Number(qaPrice);
    if (!price || price <= 0) { toast.error('Enter a valid price'); return; }
    if (!effectiveStoreId)    { toast.error('No active store'); return; }

    setQaSaving(true);
    try {
      // Auto-generate product code (no barcode)
      let productCode = '';
      const { data } = await supabase.rpc('generate_product_code', { p_store_id: effectiveStoreId });
      productCode = data ?? `ATU-${String(Math.floor(Math.random() * 90000) + 10000)}`;

      const created = await createProduct({
        store_id: effectiveStoreId,
        name: qaName.trim(),
        price,
        cost: 0,
        stock: Number(qaStock) || 10,
        threshold: 5,
        category: qaCat,
        sku: undefined,
        barcode: qaBarcode.trim() || undefined,
        product_code: productCode,
        supplier: undefined,
        active: true,
      });

      if (!created) throw new Error('Failed to create product');

      // Refresh list and immediately add to cart
      const updated = await getProducts(effectiveStoreId);
      setProducts(updated);
      const newProduct = updated.find(p => p.id === created.id) ?? created;
      addToCart(newProduct);

      toast.success(`"${qaName.trim()}" added to inventory & cart! Code: ${productCode}`);
      // Reset form
      setQaName(''); setQaPrice(''); setQaStock('10'); setQaCat('Other');
      setShowQuickAdd(false);
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    } finally {
      setQaSaving(false);
    }
  };

  const cashierName = activeStaff?.name || user?.user_metadata?.ownerName || user?.email || 'Staff';

  // Revenue stats for staff dashboard bar
  const todayRevenue   = todaySales.reduce((a, s) => a + Number(s.total), 0);
  const todayTxCount   = todaySales.length;
  const todayCash      = todaySales
    .filter((s) => s.payment_method === 'cash')
    .reduce((a, s) => a + Number(s.total), 0);

  const handleConfirmPayment = async () => {
    if (!effectiveStoreId) { toast.error('Store not found'); return; }
    if (selectedMethod === 'cash' && Number(cashGiven) < total) { toast.error('Cash given is less than total'); return; }
    
    if (selectedMethod === 'credit' || selectedMethod === 'split') {
      if (!selectedCustomer) {
        toast.error('You must select a registered customer for credit/split sales.');
        return;
      }
      
      const creditToApply = selectedMethod === 'split' ? splitCreditPortion : total;
      
      if (creditToApply > 0 && creditToApply + selectedCustomer.credit > selectedCustomer.credit_limit) {
        toast.error(`Credit limit exceeded! Limit: ${formatCurrency(selectedCustomer.credit_limit)}`);
        return;
      }
    }
    
    setProcessing(true);

    const saleDate = getTodayISO();
    const saleData = {
      store_id: effectiveStoreId,
      customer_id: selectedCustomer?.id || undefined,
      customer_name: selectedCustomer?.name || customerName || 'Walk-in',
      subtotal,
      vat,
      total,
      payment_method: selectedMethod,
      payment_ref: payRef || undefined,
      cash_given: (selectedMethod === 'cash' || selectedMethod === 'split') ? Number(cashGiven) : undefined,
      change: selectedMethod === 'cash' ? change : undefined,
      cashier_name: cashierName,
      status: 'Completed' as const,
      sale_date: saleDate,
    };

    const items = cart.map((i) => ({
      product_id: i.id,
      product_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
      line_total: i.price * i.qty,
    }));

    const sale = await createSale(saleData, items);
    if (!sale) { toast.error('Failed to save sale. Please retry.'); setProcessing(false); return; }

    // Reduce stock & log movements
    await Promise.all(
      cart.map(async (i) => {
        const newStock = Math.max(0, i.stock - i.qty);
        await updateProduct(i.id, { stock: newStock });
        await createStockMovement({
          store_id: effectiveStoreId,
          product_id: i.id,
          product_name: i.name,
          quantity: -i.qty,
          movement_type: 'Sale',
          reference_id: sale.id,
          reference_type: 'sale',
          reason: `Sale to ${customerName}`,
          created_by: user?.id,
        });
      })
    );

    // Update customer credit if store credit payment
    if (selectedCustomer) {
      if (selectedMethod === 'credit' || selectedMethod === 'split') {
        const creditToApply = selectedMethod === 'split' ? splitCreditPortion : total;
        await updateCustomer(selectedCustomer.id, {
          credit: selectedCustomer.credit + creditToApply,
          total_spent: selectedCustomer.total_spent + total,
          visits: selectedCustomer.visits + 1,
        });
      } else {
        await updateCustomer(selectedCustomer.id, {
          total_spent: selectedCustomer.total_spent + total,
          visits: selectedCustomer.visits + 1,
        });
      }
    }

    // Refresh products
    const updated = await getProducts(effectiveStoreId);
    setProducts(updated);

    setReceipt({
      id: sale.id,
      items: [...cart],
      subtotal, vat, total,
      method: selectedMethod,
      cashGiven: (selectedMethod === 'cash' || selectedMethod === 'split') ? Number(cashGiven) : undefined,
      change: selectedMethod === 'cash' ? change : undefined,
      ref: payRef || undefined,
      customer: customerName || 'Walk-in',
      date: new Date().toLocaleString('en-NA'),
    });
    setProcessing(false);
    setScreen('receipt');
  };

  const newSale = () => {
    clearCart();
    setSelectedMethod('cash');
    setCashGiven('');
    setPayRef('');
    setReceipt(null);
    setScreen('pos');
  };

  const methodObj = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const instruction = PAYMENT_INSTRUCTIONS[selectedMethod]?.replace('{amount}', formatCurrency(total)) ?? '';

  // ── Receipt screen ──────────────────────────────────────────────────────────
  if (screen === 'receipt' && receipt) {
    return (
      <div className="p-4 md:p-6 max-w-sm mx-auto">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground text-balance">Sale Complete!</h2>
              <p className="text-xs text-muted-foreground mono">#{receipt.id.slice(-8).toUpperCase()}</p>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{receipt.customer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="mono text-xs">{receipt.date}</span>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-1.5 mb-4">
              {receipt.items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm min-w-0 gap-2">
                  <span className="truncate">{i.name} ×{i.qty}</span>
                  <span className="mono shrink-0">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="mono">{formatCurrency(receipt.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span className="mono">{formatCurrency(receipt.vat)}</span></div>
              <div className="flex justify-between font-bold text-base mt-2">
                <span>Total</span><span className="mono text-primary">{formatCurrency(receipt.total)}</span>
              </div>
              {receipt.cashGiven != null && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cash Given</span><span className="mono">{formatCurrency(receipt.cashGiven)}</span></div>
                  <div className="flex justify-between text-green-600 font-semibold"><span>Change</span><span className="mono">{formatCurrency(receipt.change ?? 0)}</span></div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 h-10 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={newSale}>
                New Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Payment screen ──────────────────────────────────────────────────────────
  if (screen === 'payment') {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <Button variant="ghost" className="mb-4 -ml-2 gap-2 text-muted-foreground" onClick={() => setScreen('pos')}>
          <ChevronLeft className="h-4 w-4" /> Back to Cart
        </Button>

        <h2 className="text-xl font-bold mb-2 text-balance">Choose Payment</h2>
        <p className="text-3xl font-extrabold text-primary mono mb-6">{formatCurrency(total)}</p>

        {/* Payment methods grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelectedMethod(m.id); setCashGiven(''); setPayRef(''); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                selectedMethod === m.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs font-medium leading-tight">{m.label}</span>
              {!m.live && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">API</Badge>}
            </button>
          ))}
        </div>

        {/* Cash & Split fields */}
        {(selectedMethod === 'cash' || selectedMethod === 'split') && (
          <div className="space-y-3 mb-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">
                {selectedMethod === 'split' ? 'Cash given towards total (N$)' : 'Cash given (N$)'}
              </Label>
              <Input
                type="number"
                placeholder="e.g. 200"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                className="h-11 px-3 text-lg mono font-bold"
              />
            </div>
            {selectedMethod === 'cash' && Number(cashGiven) >= total && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <span className="text-sm font-medium text-green-700">Change</span>
                <span className="text-xl font-bold text-green-700 mono">{formatCurrency(change)}</span>
              </div>
            )}
            {selectedMethod === 'split' && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <span className="text-sm font-medium text-indigo-700">Remaining to Credit</span>
                <span className="text-xl font-bold text-indigo-700 mono">{formatCurrency(splitCreditPortion)}</span>
              </div>
            )}
          </div>
        )}

        {/* Reference number for electronic */}
        {!['cash', 'credit', 'split'].includes(selectedMethod) && (
          <div className="space-y-1.5 mb-5">
            <Label className="text-sm font-normal">Reference / confirmation number</Label>
            <Input
              placeholder="Enter ref. number"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="h-11 px-3"
            />
          </div>
        )}

        {/* Instructions */}
        {instruction && (
          <div className="bg-muted/60 rounded-lg p-3 mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Instructions</p>
            <p className="text-sm text-foreground whitespace-pre-line text-pretty">{instruction}</p>
          </div>
        )}

        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: '#166534' }}
          disabled={processing || (selectedMethod === 'cash' && Number(cashGiven) < total)}
          onClick={handleConfirmPayment}
        >
          {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : `Confirm Payment · ${formatCurrency(total)}`}
        </Button>
      </div>
    );
  }

  // ── POS screen ──────────────────────────────────────────────────────────────

  // Reusable cart content (used in both sidebar and bottom sheet)
  const CartContent = () => (
    <>
      {/* Customer */}
      <div className="px-3 py-2 border-b shrink-0 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 h-8 justify-between px-2 text-sm font-normal"
          onClick={() => setShowCustomerSelect(true)}
        >
          <span className="truncate">{selectedCustomer?.name || 'Walk-in Customer'}</span>
          <UserCircle2 className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Cart is empty</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-start gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground mono">{formatCurrency(item.price)} ea.</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted">
                  <Plus className="h-3 w-3" />
                </button>
                <button onClick={() => removeItem(item.id)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {cart.length > 0 && (
        <div className="px-4 py-3 border-t shrink-0 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (15%)</span>
            <span className="mono">{formatCurrency(vat)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="mono text-primary">{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full h-11 font-semibold mt-2"
            style={{ background: '#166634' }}
            onClick={() => { setShowMobileCart(false); setScreen('payment'); }}
          >
            Pay {formatCurrency(total)}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-screen overflow-hidden">
      {/* Product grid */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Staff-only session banner with revenue stats */}
        {isStaffOnlySession && (
          <div className="bg-[#052e16] text-white shrink-0">
            {/* Top row: name + sign out */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
              <UserCircle2 className="h-4 w-4 text-green-300 shrink-0" />
              <span className="text-xs font-medium flex-1 min-w-0 truncate">
                Signed in as <strong>{staffSession.staff.name}</strong>
                {staffSession.store?.business_name && (
                  <> · {staffSession.store.business_name}</>
                )}
              </span>
              <button
                onClick={handleStaffLogout}
                className="flex items-center gap-1 text-[11px] text-green-300 hover:text-white transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
            {/* Revenue stats row */}
            <div className="flex items-center gap-0 divide-x divide-white/10">
              <div className="flex items-center gap-1.5 px-4 py-2 flex-1 min-w-0">
                <TrendingUp className="h-3.5 w-3.5 text-green-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-green-400 font-medium leading-none">Today's Revenue</p>
                  <p className="text-sm font-bold text-white mono leading-tight">{formatCurrency(todayRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 flex-1 min-w-0">
                <Banknote className="h-3.5 w-3.5 text-green-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-green-400 font-medium leading-none">Cash</p>
                  <p className="text-sm font-bold text-white mono leading-tight">{formatCurrency(todayCash)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 shrink-0">
                <ShoppingCart className="h-3.5 w-3.5 text-green-300 shrink-0" />
                <div>
                  <p className="text-[10px] text-green-400 font-medium leading-none">Transactions</p>
                  <p className="text-sm font-bold text-white leading-tight">{todayTxCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Search + filter bar */}
        <div className="p-3 md:p-4 border-b bg-background space-y-2 shrink-0">
          <div className="flex gap-2">
            {/* Staff selector button — hidden for staff-only sessions */}
            {!isStaffOnlySession && (
              <button
                onClick={() => setShowStaffPicker(true)}
                className="h-10 px-2.5 rounded-md border border-border flex items-center gap-1.5 text-sm shrink-0 hover:border-primary/50 transition-colors"
                title="Switch staff member"
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline text-xs text-muted-foreground max-w-[80px] truncate">
                  {activeStaff?.name ?? 'Owner'}
                </span>
              </button>
            )}

            <Input
              placeholder="Scan barcode or type to search... (Press Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  const code = search.trim();
                  // Check for exact match
                  const p = products.find((pr) => pr.barcode === code || pr.sku === code || pr.product_code === code);
                  if (p) {
                    addToCart(p);
                    toast.success(`Added: ${p.name}`);
                    setSearch(''); // Ready for next scan
                  } else {
                    if (isStaffOnlySession) {
                      toast.error('Product not found in inventory');
                    } else {
                      setScanNotFoundCode(code);
                    }
                  }
                }
              }}
              className="flex-1 h-10 px-3"
            />
            <Button
              variant="outline"
              className="h-10 gap-2 shrink-0"
              onClick={() => setShowScanner(true)}
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
            {/* New Item button — owners only, staff cannot add products */}
            {!isStaffOnlySession && (
              <Button
                variant="outline"
                className="h-10 gap-1.5 shrink-0 border-primary/50 text-primary hover:bg-primary/5"
                onClick={() => setShowQuickAdd(true)}
                title="Add a new product without barcode (e.g. eggs, apples)"
              >
                <PackagePlus className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">New Item</span>
              </Button>
            )}
          </div>
          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 whitespace-nowrap">
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors shrink-0 ${
                  category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24 md:pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
              {filtered.map((p) => {
                const inCart = cart.find((i) => i.id === p.id);
                const oos = p.stock === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => { addToCart(p); }}
                    disabled={oos}
                    className={`relative text-left rounded-xl border-2 p-3 transition-all active:scale-95 ${
                      oos ? 'opacity-50 cursor-not-allowed border-border'
                        : inCart ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center z-10">
                        {inCart.qty}
                      </div>
                    )}
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2 text-lg">
                      🛒
                    </div>
                    <p className="text-xs font-semibold leading-tight line-clamp-2 text-foreground">{p.name}</p>
                    <p className="text-sm font-bold text-primary mt-1 mono">{formatCurrency(p.price)}</p>
                    <p className={`text-[10px] mt-0.5 font-medium ${p.stock <= p.threshold ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {oos ? 'Out of stock' : isStaffOnlySession ? 'In stock' : `${p.stock} in stock`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop cart panel (hidden on mobile) ── */}
      <div className="hidden md:flex w-80 shrink-0 border-l bg-card flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <ShoppingCart className="h-4 w-4" />
            <span>Cart {cart.length > 0 && <span className="text-primary">({cart.length})</span>}</span>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1" onClick={clearCart}>
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
        <CartContent />
      </div>

      {/* ── Mobile floating cart button ── */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setShowMobileCart(true)}
          className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl text-white font-semibold text-sm transition-all active:scale-95"
          style={{ background: '#166634' }}
        >
          <ShoppingCart className="h-5 w-5" />
          {cart.length > 0 ? (
            <>
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              <span className="font-bold mono">{formatCurrency(total)}</span>
            </>
          ) : (
            <span>Cart is empty</span>
          )}
        </button>
      </div>

      {/* ── Mobile cart bottom sheet ── */}
      <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
        <SheetContent side="bottom" className="h-[80dvh] flex flex-col p-0 rounded-t-2xl">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 font-bold text-base">
                <ShoppingCart className="h-4 w-4" />
                Cart {cart.length > 0 && <span className="text-primary">({cart.length})</span>}
              </SheetTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1" onClick={clearCart}>
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <CartContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Staff picker dialog ── */}
      <Dialog open={showStaffPicker} onOpenChange={(o) => { setShowStaffPicker(o); setStaffPin(''); setStaffPinTarget(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-balance">Select Staff Member</DialogTitle>
          </DialogHeader>

          {staffPinTarget ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter PIN for <strong>{staffPinTarget.name}</strong></p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter PIN"
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                className="h-12 text-xl text-center tracking-widest mono px-3"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStaffPinTarget(null); setStaffPin(''); }}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  style={{ background: '#166634' }}
                  onClick={() => {
                    if (!staffPinTarget.pin || staffPin === staffPinTarget.pin) {
                      setActiveStaff(staffPinTarget);
                      toast.success(`Now serving as ${staffPinTarget.name}`);
                      setShowStaffPicker(false);
                      setStaffPin('');
                      setStaffPinTarget(null);
                    } else {
                      toast.error('Incorrect PIN');
                      setStaffPin('');
                    }
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Owner option */}
              <button
                onClick={() => { setActiveStaff(null); setShowStaffPicker(false); toast.success('Serving as Owner'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Owner / Default</p>
                  <p className="text-xs text-muted-foreground">No PIN required</p>
                </div>
              </button>
              {staffList.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No staff added yet. Add staff in the Staff section.</p>
              )}
              {staffList.filter(s => s.active).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.pin) { setStaffPinTarget(s); setStaffPin(''); }
                    else { setActiveStaff(s); setShowStaffPicker(false); toast.success(`Now serving as ${s.name}`); }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: '#166634' }}>
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role} · {s.shift}</p>
                  </div>
                  {s.pin && <span className="ml-auto text-[10px] text-muted-foreground shrink-0">PIN required</span>}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode scanner dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-balance">Scan Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>

      {/* Scan Not Found Alert */}
      <AlertDialog open={!!scanNotFoundCode} onOpenChange={(o) => !o && setScanNotFoundCode(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Product Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              Barcode <span className="font-mono bg-muted px-1 rounded">{scanNotFoundCode}</span> was not found in your inventory.
              Would you like to add a new product with this barcode now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                const code = scanNotFoundCode;
                setScanNotFoundCode(null);
                setQaBarcode(code || '');
                setShowQuickAdd(true);
            }}>
              Continue Adding Info
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick-add product modal — owners only, hidden from staff */}
      {!isStaffOnlySession && (
      <Dialog open={showQuickAdd} onOpenChange={(o) => { if (!o) { setQaName(''); setQaPrice(''); setQaStock('10'); setQaCat('Other'); setQaBarcode(''); } setShowQuickAdd(o); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-balance">
              <PackagePlus className="h-4 w-4 text-primary shrink-0" />
              Add New Item to POS
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-start gap-2">
            <Tag className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary text-pretty">
              {qaBarcode ? (
                <>Adding product with scanned barcode <strong>{qaBarcode}</strong>. It will be added to your inventory and cart instantly.</>
              ) : (
                <>For items without barcodes (eggs, apples…). A unique <strong>ATU-XXXXX</strong> code is auto-generated and the item is added to your inventory and cart instantly.</>
              )}
            </p>
          </div>

          <div className="space-y-3 mt-1">
            {qaBarcode && (
              <div className="space-y-1.5">
                <Label className="text-sm font-normal text-muted-foreground">Scanned Barcode</Label>
                <Input value={qaBarcode} disabled className="h-9 px-3 bg-muted font-mono text-sm" />
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">
                Product name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Boiled Eggs (6 pack)"
                value={qaName}
                onChange={(e) => setQaName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }}
                className="h-10 px-3"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">
                  Selling price (N$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={qaPrice}
                  onChange={(e) => setQaPrice(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }}
                  className="h-10 px-3 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Stock qty</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="10"
                  value={qaStock}
                  onChange={(e) => setQaStock(e.target.value)}
                  className="h-10 px-3 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Category</Label>
              <Select value={qaCat} onValueChange={setQaCat}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 h-10"
              onClick={() => setShowQuickAdd(false)} disabled={qaSaving}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 font-semibold"
              style={{ background: '#166534' }}
              onClick={handleQuickAdd}
              disabled={qaSaving}
            >
              {qaSaving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
                : 'Add & Sell'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )} {/* end owner-only quick-add */}

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerSelect} onOpenChange={setShowCustomerSelect}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerName('Walk-in');
                  setShowCustomerSelect(false);
                }}
              >
                Walk-in Customer
              </Button>
              <Button 
                className="h-12"
                onClick={() => {
                  setShowCustomerSelect(false);
                  setShowAddCustomer(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> New
              </Button>
            </div>
            
            <div className="pt-2">
              <Input 
                placeholder="Search customers..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="h-10"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2">
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No registered customers</p>
              ) : (
                customers
                  .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch))
                  .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerName(c.name);
                      setShowCustomerSelect(false);
                      setCustomerSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left hover:bg-muted transition-colors ${selectedCustomer?.id === c.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                    {c.credit_limit > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        Credit Limit: {formatCurrency(c.credit_limit)}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Name <span className="text-destructive">*</span></Label>
              <Input 
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone Number</Label>
              <Input 
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="e.g. 081..."
              />
            </div>
            <div className="rounded-md bg-muted p-3 mt-2">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> New customers have a N$0.00 credit limit by default. The owner must increase their limit in the Customers page before they can buy on credit.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddCustomer} disabled={newCustSaving}>
                {newCustSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Select'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}


