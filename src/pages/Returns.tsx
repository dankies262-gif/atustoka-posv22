import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSales, updateSale, updateProduct, createStockMovement } from '@/services/database';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale } from '@/types/database';

export default function Returns() {
  const { store, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState<Sale | null>(null);
  const [reason, setReason] = useState('');

  const refresh = () => getSales(store?.id).then(setSales).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openReturn = (s: Sale) => { setTarget(s); setReason(''); setShowModal(true); };

  const handleReturn = async () => {
    if (!target || !reason.trim()) { toast.error('Return reason is required'); return; }
    setProcessing(true);
    // Mark as returned
    await updateSale(target.id, { status: 'Returned', return_reason: reason });
    // Restock items
    await Promise.all(
      (target.items ?? []).map(async (item) => {
        await updateProduct(item.product_id, { stock: (item.current_stock ?? 0) + item.quantity });
        await createStockMovement({
          store_id: store?.id ?? '',
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          movement_type: 'Return',
          reference_id: target.id,
          reference_type: 'return',
          reason: `Return: ${reason}`,
          created_by: user?.id,
        });
      })
    );
    setProcessing(false);
    setShowModal(false);
    toast.success('Return processed and stock restored');
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-balance">Returns</h1>
        <p className="text-sm text-muted-foreground text-pretty">Process refunds and restock returned goods</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="whitespace-nowrap">Method</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7].map((j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No sales transactions</TableCell></TableRow>
                ) : (
                  sales.map((s) => {
                    const method = PAYMENT_METHODS.find((m) => m.id === s.payment_method);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap"><span className="mono text-xs text-muted-foreground">#{s.id.slice(-5).toUpperCase()}</span></TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-sm">{s.customer_name}</TableCell>
                        <TableCell className="whitespace-nowrap"><span className="mono text-xs">{s.sale_date}</span></TableCell>
                        <TableCell className="whitespace-nowrap text-right mono text-sm font-medium">{formatCurrency(Number(s.total))}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="text-[10px]">{method?.label ?? s.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {s.status === 'Returned'
                            ? <Badge variant="destructive" className="text-[10px]">Returned</Badge>
                            : <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200">Completed</Badge>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {s.status !== 'Returned' && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openReturn(s)}>
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle className="text-balance">Process Return</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-semibold">{target?.customer_name}</p>
              <p className="text-sm mono text-primary font-bold">{target ? formatCurrency(Number(target.total)) : ''}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Return reason *</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 px-3" placeholder="e.g. Wrong item, defective product" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleReturn} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
