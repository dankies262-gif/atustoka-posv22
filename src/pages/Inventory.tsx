import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, BarChart2, ScanLine, Loader2, Zap, Settings2, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { getProducts, createProduct, updateProduct, deleteProduct, createStockMovement } from '@/services/database';
import { formatCurrency } from '@/lib/format';
import { CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { STAFF_SESSION_KEY } from '@/pages/auth/Login';
import type { Product } from '@/types/database';

const EMPTY: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  store_id: '', name: '', sku: '', barcode: '', product_code: '', price: 0, cost: 0,
  stock: 0, threshold: 5, category: 'Other', supplier: '', active: true,
};

export default function Inventory() {
  const { store, user } = useAuth();

  // Detect staff-only session (PIN login, no Supabase auth user)
  const staffSession = (() => {
    try {
      const raw = localStorage.getItem(STAFF_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  })();
  const isStaffSession = !!(staffSession?.staff?.id && staffSession?.store?.id) && !user;
  const effectiveStoreId = store?.id ?? staffSession?.store?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY });
  const [quickMode, setQuickMode] = useState(true);
  const [addAnother, setAddAnother] = useState(false);
  const [addCount, setAddCount] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);

  // scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'lookup' | 'add'>('lookup');
  // pending barcode to pre-fill after scanner closes form
  const pendingBarcode = useRef<string | null>(null);
  const [scanNotFoundCode, setScanNotFoundCode] = useState<string | null>(null);

  // adj / delete
  const [showAdj, setShowAdj] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [adjTarget, setAdjTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const refresh = useCallback(
    () => getProducts(effectiveStoreId).then(setProducts).finally(() => setLoading(false)),
    [effectiveStoreId]
  );
  useEffect(() => { refresh(); }, [refresh]);

  // When scanner closes (showScanner goes false) and we have a pending barcode, open quick add
  useEffect(() => {
    if (!showScanner && pendingBarcode.current !== null) {
      const bc = pendingBarcode.current;
      pendingBarcode.current = null;
      setEditing(null);
      setFormData({ ...EMPTY, store_id: store?.id ?? '', barcode: bc });
      setAddCount(0);
      setQuickMode(true);
      setShowForm(true);
      setTimeout(() => nameRef.current?.focus(), 120);
    }
  }, [showScanner, store?.id]);

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    return (!search || p.name.toLowerCase().includes(s) || p.sku?.includes(s) || p.barcode?.includes(s) || p.product_code?.toLowerCase().includes(s))
      && (catFilter === 'All' || p.category === catFilter);
  });

  // ── open helpers ─────────────────────────────────────────────────────────────
  const openAdd = (prefill?: Partial<typeof EMPTY>) => {
    setEditing(null);
    setFormData({ ...EMPTY, store_id: store?.id ?? '', ...prefill });
    setAddCount(0);
    setShowForm(true);
    setQuickMode(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setFormData({ ...p });
    setQuickMode(false);
    setShowForm(true);
  };

  const openAdj = (p: Product) => {
    setAdjTarget(p); setAdjQty(''); setAdjReason(''); setShowAdj(true);
  };

  // ── save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Product name is required'); nameRef.current?.focus(); return; }
    if (formData.price <= 0)   { toast.error('Price must be greater than 0'); return; }
    setSaving(true);
    if (editing) {
      const r = await updateProduct(editing.id, formData);
      if (r) toast.success('Product updated'); else toast.error('Failed to update');
      setSaving(false);
      setShowForm(false);
    } else {
      // Auto-generate product code if no barcode provided
      let productCode = formData.product_code || '';
      if (!formData.barcode?.trim() && !productCode) {
        const storeId = store?.id ?? '';
        if (storeId) {
          const { data } = await supabase.rpc('generate_product_code', { p_store_id: storeId });
          productCode = data ?? `ATU-${String(Math.floor(Math.random() * 90000) + 10000)}`;
        }
      }
      const r = await createProduct({ ...formData, store_id: effectiveStoreId ?? '', product_code: productCode || undefined });
      if (r) {
        const n = addCount + 1;
        setAddCount(n);
        if (productCode && !formData.barcode?.trim()) {
          toast.success(`Product added — auto code: ${productCode} (${n} this session)`);
        } else {
          toast.success(`Product added (${n} this session)`);
        }
        if (addAnother) {
          setFormData(prev => ({ ...EMPTY, store_id: effectiveStoreId ?? '', category: prev.category, barcode: '', product_code: '' }));
          setTimeout(() => nameRef.current?.focus(), 60);
        } else {
          setShowForm(false);
        }
      } else {
        toast.error('Failed to add product');
      }
      setSaving(false);
    }
    refresh();
  };

  const onFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
  };

  // ── adj / delete ─────────────────────────────────────────────────────────────
  const handleAdj = async () => {
    if (!adjTarget) return;
    const delta = parseInt(adjQty);
    if (isNaN(delta) || delta === 0) { toast.error('Enter a non-zero quantity'); return; }
    const newStock = Math.max(0, adjTarget.stock + delta);
    setSaving(true);
    await updateProduct(adjTarget.id, { stock: newStock });
    await createStockMovement({
      store_id: store?.id ?? '',
      product_id: adjTarget.id,
      product_name: adjTarget.name,
      quantity: delta,
      movement_type: delta > 0 ? 'Restock' : 'Adjustment',
      reason: adjReason || 'Manual adjustment',
      created_by: user?.id,
    });
    setSaving(false);
    setShowAdj(false);
    toast.success(`Stock updated to ${newStock}`);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    toast.success('Product removed');
    setShowDelete(false);
    refresh();
  };

  // ── scanner callback ──────────────────────────────────────────────────────────
  const handleScan = (code: string) => {
    const found = products.find((p) => p.barcode === code);
    if (found) {
      setShowScanner(false);
      openEdit(found);
      toast.success(`Found: ${found.name}`);
    } else if (scannerMode === 'add') {
      // store barcode, close scanner — useEffect will open quick-add once scanner is fully closed
      pendingBarcode.current = code;
      setShowScanner(false);
      toast.info('New barcode — fill in product details');
    } else {
      setSearch(code);
      if (isStaffSession) {
        setShowScanner(false);
        toast.info('Not found — search populated');
      } else {
        setShowScanner(false);
        setScanNotFoundCode(code);
      }
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────────
  const stockBadge = (p: Product) => {
    if (p.stock === 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
    if (p.stock <= p.threshold) return <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Low Stock</Badge>;
    return <Badge variant="secondary" className="text-[10px]">In Stock</Badge>;
  };

  const margin = (p: Product) => p.cost > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : '-';

  const set = (field: Partial<typeof EMPTY>) => setFormData(prev => ({ ...prev, ...field }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} products · {products.filter((p) => p.stock <= p.threshold).length} low stock
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!isStaffSession && (
            <Button variant="outline" className="h-9 gap-2"
              onClick={() => { setScannerMode('add'); setShowScanner(true); }}>
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan to Add</span>
              <span className="sm:hidden">Scan</span>
            </Button>
          )}
          {!isStaffSession && (
            <Button className="h-9 gap-2" style={{ background: '#166534' }} onClick={() => openAdd()}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
          {isStaffSession && (
            <Button variant="outline" className="h-9 gap-2"
              onClick={() => { setScannerMode('lookup'); setShowScanner(true); }}>
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan to Look Up</span>
              <span className="sm:hidden">Scan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"
            title="Scan to look up existing product"
            onClick={() => { setScannerMode('lookup'); setShowScanner(true); }}>
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">SKU/Barcode</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Cost</TableHead>
                  <TableHead className="whitespace-nowrap">Price</TableHead>
                  <TableHead className="whitespace-nowrap">Margin</TableHead>
                  <TableHead className="whitespace-nowrap">Stock</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No products found.{' '}
                      {!isStaffSession && (
                        <button onClick={() => openAdd()} className="text-primary font-semibold hover:underline">
                          Add one now →
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          {p.supplier && <p className="text-[11px] text-muted-foreground">{p.supplier}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="mono text-xs text-muted-foreground">
                          {p.sku && <p>{p.sku}</p>}
                          {p.barcode && <p>{p.barcode}</p>}
                          {p.product_code && !p.barcode && (
                            <p className="flex items-center gap-1 text-indigo-500 font-semibold">
                              <Tag className="h-2.5 w-2.5 shrink-0" />{p.product_code}
                            </p>
                          )}
                          {!p.sku && !p.barcode && !p.product_code && <span className="text-muted-foreground/50">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap mono text-sm">{formatCurrency(p.cost)}</TableCell>
                      <TableCell className="whitespace-nowrap mono text-sm font-semibold">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`text-xs font-semibold mono ${Number(margin(p)) > 20 ? 'text-green-600' : 'text-amber-600'}`}>
                          {margin(p)}%
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`mono text-sm font-bold ${p.stock === 0 ? 'text-destructive' : p.stock <= p.threshold ? 'text-amber-600' : 'text-foreground'}`}>
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{stockBadge(p)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isStaffSession && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAdj(p)}><BarChart2 className="h-3.5 w-3.5" /></Button>
                          {!isStaffSession && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => { setDeleteTarget(p); setShowDelete(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Edit Product dialog ── */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setAddCount(0); setShowForm(o); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-balance">
                {editing ? 'Edit Product' : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Quick Add
                    {addCount > 0 && (
                      <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200 ml-1">
                        {addCount} added
                      </Badge>
                    )}
                  </span>
                )}
              </DialogTitle>
              {!editing && (
                <button
                  onClick={() => setQuickMode(!quickMode)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {quickMode ? 'Full details' : 'Quick mode'}
                  {quickMode ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </button>
              )}
            </div>
            {!editing && quickMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Fill 4 fields and press{' '}
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd>
                {' '}or tap Save. Toggle &ldquo;Full details&rdquo; for more options.
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3 py-2">

            {quickMode && !editing ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">
                    Product name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={nameRef}
                    value={formData.name}
                    onChange={(e) => set({ name: e.target.value })}
                    onKeyDown={onFieldKeyDown}
                    className="h-11 px-3 text-base"
                    placeholder="e.g. Windhoek Lager 24pk"
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
                      value={formData.price || ''}
                      onChange={(e) => set({ price: Number(e.target.value) })}
                      onKeyDown={onFieldKeyDown}
                      className="h-11 px-3 mono text-base"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Stock qty</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={formData.stock || ''}
                      onChange={(e) => set({ stock: Number(e.target.value) })}
                      onKeyDown={onFieldKeyDown}
                      className="h-11 px-3 mono text-base"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => set({ category: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {formData.barcode ? (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Barcode (pre-filled from scan)</Label>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => set({ barcode: e.target.value })}
                      onKeyDown={onFieldKeyDown}
                      className="h-10 px-3 mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setScannerMode('add'); setShowForm(false); setShowScanner(true); }}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    Scan barcode for this product
                  </button>
                )}

                <Separator />

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setAddAnother(!addAnother)}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${addAnother ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${addAnother ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">Keep adding after save</span>
                </label>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">
                    Product name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={nameRef}
                    value={formData.name}
                    onChange={(e) => set({ name: e.target.value })}
                    onKeyDown={onFieldKeyDown}
                    className="h-10 px-3"
                    placeholder="e.g. Windhoek Lager 24pk"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">SKU</Label>
                    <Input value={formData.sku ?? ''} onChange={(e) => set({ sku: e.target.value })} className="h-10 px-3 mono" placeholder="WHL-024" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Barcode</Label>
                    <div className="flex gap-1.5">
                      <Input value={formData.barcode ?? ''} onChange={(e) => set({ barcode: e.target.value })} className="h-10 px-3 mono flex-1" placeholder="6001234000001" />
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"
                        title="Scan barcode"
                        onClick={() => { setScannerMode('add'); setShowForm(false); setShowScanner(true); }}>
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                    {!formData.barcode?.trim() && (
                      <p className="text-[11px] text-indigo-500 flex items-center gap-1 mt-0.5">
                        <Tag className="h-3 w-3 shrink-0" />
                        No barcode? A unique product code (ATU-XXXXX) will be auto-generated on save.
                      </p>
                    )}
                    {editing?.product_code && !formData.barcode?.trim() && (
                      <p className="text-[11px] text-indigo-600 font-mono mt-0.5 flex items-center gap-1">
                        <Tag className="h-3 w-3 shrink-0" /> Current code: {editing.product_code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">
                      Selling price (N$) <span className="text-destructive">*</span>
                    </Label>
                    <Input type="number" inputMode="decimal" value={formData.price || ''} onChange={(e) => set({ price: Number(e.target.value) })} className="h-10 px-3 mono" placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Cost price (N$)</Label>
                    <Input type="number" inputMode="decimal" value={formData.cost || ''} onChange={(e) => set({ cost: Number(e.target.value) })} className="h-10 px-3 mono" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Stock qty</Label>
                    <Input type="number" inputMode="numeric" value={formData.stock || ''} onChange={(e) => set({ stock: Number(e.target.value) })} className="h-10 px-3 mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Low stock alert at</Label>
                    <Input type="number" inputMode="numeric" value={formData.threshold || ''} onChange={(e) => set({ threshold: Number(e.target.value) })} className="h-10 px-3 mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => set({ category: v })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Supplier</Label>
                  <Input value={formData.supplier ?? ''} onChange={(e) => set({ supplier: e.target.value })} className="h-10 px-3" placeholder="e.g. Namibia Breweries" />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11"
                onClick={() => { setShowForm(false); setAddCount(0); }}>
                {addCount > 0 ? 'Done' : 'Cancel'}
              </Button>
              <Button
                className="flex-1 h-11 font-semibold"
                style={{ background: '#166534' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : editing ? 'Save Changes'
                  : addAnother ? 'Save & Add Next'
                  : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock adjustment dialog */}
      <Dialog open={showAdj} onOpenChange={setShowAdj}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-balance">Adjust Stock — {adjTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">Current stock</span>
              <span className="font-bold mono text-lg">{adjTarget?.stock}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Change (+24 restock · &minus;6 loss)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdj(); }}
                className="h-11 px-3 mono text-base"
                placeholder="+24 or -6"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Reason</Label>
              <Input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdj(); }}
                className="h-10 px-3"
                placeholder="e.g. Restock delivery"
              />
            </div>
            {adjQty && !isNaN(parseInt(adjQty)) && (
              <p className="text-sm text-center text-muted-foreground">
                New stock will be{' '}
                <strong className="text-foreground mono">
                  {Math.max(0, (adjTarget?.stock ?? 0) + parseInt(adjQty))}
                </strong>
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowAdj(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleAdj} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-balance">Remove product?</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              &ldquo;{deleteTarget?.name}&rdquo; will be deactivated and hidden from the POS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode scanner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-balance">
              {scannerMode === 'add' ? 'Scan Barcode to Add Product' : 'Scan to Look Up Product'}
            </DialogTitle>
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
                pendingBarcode.current = code;
                setEditing(null);
                setFormData({ ...EMPTY, store_id: store?.id ?? '', barcode: code || '' });
                setAddCount(0);
                setQuickMode(false);
                setShowForm(true);
            }}>
              Continue Adding Info
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
