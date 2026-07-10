import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStockMovements } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { StockMovement } from '@/types/database';

export default function StockHistory() {
  const { store } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStockMovements(store?.id).then(setMovements).finally(() => setLoading(false));
  }, [store?.id]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-balance">Stock History</h1>
        <p className="text-sm text-muted-foreground text-pretty">Track all inventory movements and adjustments</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Movement</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{[1, 2, 3, 4, 5].map((j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>
                  ))
                ) : movements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No stock movements recorded</TableCell></TableRow>
                ) : (
                  movements.map((m) => {
                    const method = PAYMENT_METHODS.find((pm) => pm.id === m.reference_type);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap">
                          <span className="mono text-xs text-muted-foreground">{m.created_at?.split('T')[0] ?? '—'}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-sm">{m.product_name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {m.quantity > 0
                              ? <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              : <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />}
                            <span className={`mono text-sm font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              m.movement_type === 'Sale' ? 'bg-primary/10 text-primary' :
                              m.movement_type === 'Return' ? 'bg-green-100 text-green-700' :
                              m.movement_type === 'Restock' ? 'bg-blue-100 text-blue-700' :
                              ''
                            }`}
                          >
                            {m.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {m.reason ?? (method ? `${method.icon} ${method.label}` : '—')}
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
    </div>
  );
}
