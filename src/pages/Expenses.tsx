import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getExpenses, createExpense } from '@/services/database';
import { formatCurrency } from '@/lib/format';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Expense } from '@/types/database';

export default function Expenses() {
  const { store, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: '', amount: '', category: 'Operations',
    expense_date: new Date().toISOString().split('T')[0], paid_by: '',
  });

  const refresh = () => getExpenses(store?.id).then(setExpenses).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    const r = await createExpense({
      store_id: store?.id ?? '',
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      expense_date: form.expense_date,
      paid_by: form.paid_by || user?.user_metadata?.ownerName || 'Owner',
    });
    setSaving(false);
    if (r) { toast.success('Expense recorded'); setShowForm(false); refresh(); }
    else toast.error('Failed to save expense');
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-destructive mono">{formatCurrency(total)}</span>
          </p>
        </div>
        <Button className="h-9 gap-2 shrink-0" style={{ background: '#166534' }} onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Paid By</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No expenses recorded yet</TableCell></TableRow>
                ) : (
                  expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap"><span className="mono text-xs">{e.expense_date}</span></TableCell>
                      <TableCell className="whitespace-nowrap font-semibold text-sm">{e.description}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200">{e.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{e.paid_by}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <span className="mono text-sm font-bold text-destructive">{formatCurrency(Number(e.amount))}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle className="text-balance">Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Description *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-10 px-3" placeholder="e.g. Monthly electricity bill" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Amount (N$) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-10 px-3 mono" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Date</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="h-10 px-3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Paid by</Label>
              <Input value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })} className="h-10 px-3" placeholder="e.g. Owner / Manager" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
