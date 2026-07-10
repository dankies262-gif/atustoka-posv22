import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getCustomers, updateCustomer } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/format';
import type { Customer } from '@/types/database';

export default function StoreCredits() {
  const { store } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const refresh = () => getCustomers(store?.id).then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCredit = customers.reduce((a, c) => a + c.credit, 0);

  const openAdd = (c: Customer) => { setSelected(c); setAmount(''); setNote(''); setShowAdd(true); };

  const handleAddCredit = async () => {
    if (!selected || !amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    await updateCustomer(selected.id, { credit: selected.credit + Number(amount) });
    setSaving(false);
    setShowAdd(false);
    toast.success('Credit added');
    refresh();
  };

  const handleClear = async (c: Customer) => {
    await updateCustomer(c.id, { credit: 0 });
    toast.success('Credit cleared');
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-balance">Store Credits</h1>
        <p className="text-sm text-muted-foreground">
          Total outstanding: <span className="font-bold text-amber-600 mono">{formatCurrency(totalCredit)}</span>
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold">No customers</p>
          <p className="text-sm mt-1">Add customers first from the Customers page</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c) => (
            <Card key={c.id} className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || 'No phone'}</p>
                  </div>
                  <p className={`text-2xl font-extrabold mono shrink-0 ${c.credit > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {formatCurrency(c.credit)}
                  </p>
                </div>
                <Separator className="mb-3" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => openAdd(c)}
                  >
                    <Plus className="h-3 w-3" /> Credit
                  </Button>
                  {c.credit > 0 && (
                    <Button
                      variant="outline"
                      className="flex-1 h-8 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => handleClear(c)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle className="text-balance">Add Credit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-semibold">{selected?.name}</p>
              <p className="text-xs text-muted-foreground">Current credit: <span className="mono font-medium text-amber-600">{formatCurrency(selected?.credit ?? 0)}</span></p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Amount (N$)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 px-3 mono" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-10 px-3" placeholder="e.g. Goods on account" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleAddCredit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Credit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
