import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getSales, getProducts, getExpenses } from '@/services/database';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale, Product, Expense } from '@/types/database';

interface Metric { label: string; value: string; icon: string; color: string; }

export default function Reports() {
  const { store } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSales(store?.id), getProducts(store?.id), getExpenses(store?.id)]).then(([s, p, e]) => {
      setSales(s); setProducts(p); setExpenses(e);
    }).finally(() => setLoading(false));
  }, [store?.id]);

  const revenue = sales.reduce((a, s) => a + Number(s.total), 0);
  const cogs = sales.flatMap((s) => s.items ?? []).reduce((a, item) => {
    const p = products.find((pr) => pr.id === item.product_id);
    return a + (p?.cost ?? 0) * item.quantity;
  }, 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';

  const metrics: Metric[] = [
    { label: 'Total Revenue', value: formatCurrency(revenue), icon: '📈', color: 'text-primary' },
    { label: 'Cost of Goods', value: formatCurrency(cogs), icon: '📦', color: 'text-amber-600' },
    { label: 'Gross Profit', value: formatCurrency(grossProfit), icon: '💰', color: 'text-green-600' },
    { label: 'Expenses', value: formatCurrency(totalExpenses), icon: '💸', color: 'text-destructive' },
    { label: 'Net Profit', value: formatCurrency(netProfit), icon: '📊', color: netProfit >= 0 ? 'text-green-600' : 'text-destructive' },
    { label: 'Gross Margin', value: `${grossMargin}%`, icon: '%', color: 'text-purple-600' },
  ];

  // Top products by revenue
  interface ProductStat { name: string; units: number; revenue: number; }
  const productMap: Record<string, ProductStat> = {};
  sales.forEach((s) => {
    (s.items ?? []).forEach((item) => {
      if (!productMap[item.product_id]) productMap[item.product_id] = { name: item.product_name, units: 0, revenue: 0 };
      productMap[item.product_id].units += item.quantity;
      productMap[item.product_id].revenue += item.line_total;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const CHART_COLORS = ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Financial Reports</h1>
          <p className="text-sm text-muted-foreground text-pretty">Overall business performance summary</p>
        </div>
        <Button variant="outline" className="h-9 gap-2 shrink-0" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="h-full">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl shrink-0">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">{m.label}</p>
                  <p className={`text-lg md:text-xl font-bold mt-0.5 mono truncate ${m.color}`}>{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">Top 5 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sales data available</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `N$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {topProducts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 min-w-0">
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: CHART_COLORS[i] }}>{i + 1}</span>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.units} units</span>
                  <span className="mono text-xs font-semibold text-primary shrink-0">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* P&L Summary */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">Profit & Loss Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Revenue', value: revenue, color: 'text-foreground' },
                { label: '– Cost of Goods Sold', value: -cogs, color: 'text-destructive' },
                null,
                { label: '= Gross Profit', value: grossProfit, color: 'text-green-600', bold: true },
                { label: '– Expenses', value: -totalExpenses, color: 'text-destructive' },
                null,
                { label: '= Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-green-600' : 'text-destructive', bold: true },
              ].map((row, i) => {
                if (row === null) return <Separator key={i} />;
                return (
                  <div key={row.label} className={`flex items-center justify-between gap-2 min-w-0 ${row.bold ? 'pt-1' : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-bold' : 'text-muted-foreground'} truncate`}>{row.label}</span>
                    <span className={`mono text-sm shrink-0 ${row.bold ? 'font-bold text-base' : 'font-medium'} ${row.color}`}>
                      {formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
