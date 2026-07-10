import { useEffect, useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCustomers, createCustomer, updateCustomer } from '@/services/database';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import { STAFF_SESSION_KEY } from '@/pages/auth/Login';
import type { Customer } from '@/types/database';

const TYPE_COLORS: Record<string, string> = { VIP: 'bg-amber-100 text-amber-800', Regular: 'bg-primary/10 text-primary', New: 'bg-purple-100 text-purple-800' };
const AVATAR_COLORS = ['bg-primary', 'bg-amber-600', 'bg-purple-600', 'bg-blue-600', 'bg-rose-600'];

export default function Customers() {
  const { store, user } = useAuth();
  
  // Detect staff-only session
  const staffSession = (() => {
    try {
      const raw = localStorage.getItem(STAFF_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  })();
  const isStaffSession = !!(staffSession?.staff?.id && staffSession?.store?.id) && !user;
  const effectiveStoreId = store?.id ?? staffSession?.store?.id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'New' as Customer['type'], credit_limit: 0 });

  const refresh = () => getCustomers(effectiveStoreId).then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [effectiveStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = customers.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', email: '', type: 'New', credit_limit: 0 }); setShowForm(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', type: c.type, credit_limit: c.credit_limit || 0 }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    if (editing) {
      const r = await updateCustomer(editing.id, form);
      if (r) toast.success('Customer updated'); else toast.error('Failed to update');
    } else {
      const r = await createCustomer({ ...form, store_id: effectiveStoreId ?? '', credit: 0, total_spent: 0, visits: 0 });
      if (r) toast.success('Customer added'); else toast.error('Failed to add');
    }
    setSaving(false);
    setShowForm(false);
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} registered customers</p>
        </div>
        <Button className="h-9 gap-2 shrink-0" style={{ background: '#166534' }} onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold">No customers yet</p>
          <p className="text-sm mt-1">Add your first customer to start tracking</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <Card key={c.id} className="h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(c)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 border ${TYPE_COLORS[c.type] ?? ''}`}>{c.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs font-bold text-primary mono">{formatCurrency(c.total_spent)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Spent</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs font-bold text-foreground">{c.visits}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Visits</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className={`text-xs font-bold mono ${c.credit > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{formatCurrency(c.credit)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Credit {c.credit_limit > 0 ? `(Max: ${formatCurrency(c.credit_limit)})` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle className="text-balance">{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 px-3" placeholder="e.g. Maria Hamutenya" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Phone number</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 px-3" placeholder="0811234567" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 px-3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Customer type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Customer['type'] })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isStaffSession && (
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Credit Limit (N$)</Label>
                <Input type="number" min="0" step="100" value={form.credit_limit || ''} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} className="h-10 px-3 mono" placeholder="0.00" />
                <p className="text-xs text-muted-foreground">Maximum amount this customer is allowed to owe. Set to 0 to disable credit sales.</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
