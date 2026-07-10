import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Banknote, CreditCard, Package, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHODS, ROLE_COLORS } from '@/lib/constants';
import { getSales, getProducts, getCustomers, getExpenses, getStaff } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import type { Sale, Product, Customer, Staff } from '@/types/database';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function buildWeekData(sales: Sale[]) {
  const days: { day: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-NA', { weekday: 'short' });
    const revenue = sales
      .filter((s) => s.sale_date?.startsWith(iso))
      .reduce((acc, s) => acc + Number(s.total), 0);
    days.push({ day: label, revenue });
  }
  return days;
}

function buildPaymentData(sales: Sale[]) {
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.sale_date?.startsWith(today));
  const map: Record<string, number> = {};
  todaySales.forEach((s) => {
    map[s.payment_method] = (map[s.payment_method] || 0) + 1;
  });
  return Object.entries(map).map(([id, value]) => {
    const method = PAYMENT_METHODS.find((m) => m.id === id);
    return { name: method?.label ?? id, value, color: method?.color ?? '#64748b' };
  });
}

export default function Dashboard() {
  const { store, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    const sid = store?.id;
    Promise.all([
      getSales(sid),
      getProducts(sid),
      getCustomers(sid),
      getExpenses(sid),
      getStaff(sid),
    ]).then(([s, p, c, _e, st]) => {
      setSales(s);
      setProducts(p);
      setCustomers(c);
      setStaff(st);
      setLoading(false);
    });
    // Fetch subscription expiry for this owner
    if (user) {
      supabase
        .from('profiles')
        .select('subscription_expires_at, role')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role !== 'superadmin' && data?.subscription_expires_at) {
            setSubscriptionExpiry(data.subscription_expires_at);
          }
        });
    }
  }, [store?.id, authLoading, user]);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.sale_date?.startsWith(today));
  const todayRevenue = todaySales.reduce((a, s) => a + Number(s.total), 0);
  const todayCash = todaySales.filter((s) => s.payment_method === 'cash').reduce((a, s) => a + Number(s.total), 0);
  const totalCredit = customers.reduce((a, c) => a + Number(c.credit), 0);
  const creditCount = customers.filter((c) => Number(c.credit) > 0).length;
  const inventoryValue = products.reduce((a, p) => a + Number(p.price) * Number(p.stock), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.threshold && p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.threshold);
  const todayReturns = sales.filter((s) => s.status === 'Returned' && s.sale_date?.startsWith(today));
  const todayReturnsValue = todayReturns.reduce((a, s) => a + Number(s.total), 0);

  const stats: StatCard[] = [
    {
      label: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      sub: `${todaySales.length} transaction${todaySales.length !== 1 ? 's' : ''}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-primary',
    },
    {
      label: 'Cash Sales',
      value: formatCurrency(todayCash),
      sub: 'Cash collected today',
      icon: <Banknote className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      label: 'Outstanding Credit',
      value: formatCurrency(totalCredit),
      sub: `${creditCount} customer${creditCount !== 1 ? 's' : ''} with credit`,
      icon: <CreditCard className="h-5 w-5" />,
      color: 'text-amber-600',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventoryValue),
      sub: `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} low in stock`,
      icon: <Package className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      label: 'Returns / Refunds',
      value: formatCurrency(todayReturnsValue),
      sub: `${todayReturns.length} return${todayReturns.length !== 1 ? 's' : ''} today`,
      icon: <RotateCcw className="h-5 w-5" />,
      color: 'text-rose-600',
      onClick: () => navigate('/returns'),
    },
  ];

  const weekData = buildWeekData(sales);
  const paymentData = buildPaymentData(sales);
  const recentSales = [...sales].slice(0, 6);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-muted" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl bg-muted" />
          <Skeleton className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
          {store ? store.business_name : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-NA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {store && <span className="ml-2 text-xs">· {store.business_type} · {store.region}</span>}
        </p>
      </div>

      {/* Subscription expiry warning banner */}
      {subscriptionExpiry && (() => {
        const exp = new Date(subscriptionExpiry);
        const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 30) return null;
        const expired = daysLeft < 0;
        return (
          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
            expired
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {expired
                  ? 'Your subscription has expired'
                  : `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
              </p>
              <p className="text-xs mt-0.5 text-pretty">
                {expired
                  ? 'Your account has been deactivated. Please contact AtuStoka support to renew your subscription.'
                  : `Renew by ${exp.toLocaleDateString('en-NA', { day: 'numeric', month: 'long', year: 'numeric' })} to avoid interruption. Contact AtuStoka support to renew.`}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`h-full ${stat.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                  <p className={`text-lg md:text-xl font-bold mt-1 mono truncate ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{stat.sub}</p>
                </div>
                <div className={`shrink-0 ${stat.color} opacity-80`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 7-day sales chart */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">7-Day Sales Trend</CardTitle>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(weekData.reduce((a, d) => a + d.revenue, 0))}
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `N$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#166534" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">Payment Methods Today</CardTitle>
            <p className="text-xs text-muted-foreground">{todaySales.length} transactions</p>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No sales today yet</div>
            ) : (
              <div className="w-full min-w-0 overflow-hidden h-48 flex items-center">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {paymentData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 min-w-0 space-y-1.5 pl-2">
                  {paymentData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-foreground truncate">{d.name}</span>
                      <span className="text-xs font-semibold text-muted-foreground ml-auto shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lower row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Staff on duty */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">Staff on Duty</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.filter((s) => s.active).length === 0 ? (
              <p className="text-sm text-muted-foreground text-pretty">No active staff found</p>
            ) : (
              <div className="space-y-2">
                {staff.filter((s) => s.active).slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: ROLE_COLORS[s.role] || '#64748b' }}
                    >
                      {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{s.role}</Badge>
                        {s.shift && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {s.shift}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-balance">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outOfStock.length === 0 && lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-pretty">All stock levels are healthy</p>
            ) : (
              <div className="space-y-2">
                {outOfStock.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-sm truncate flex-1">{p.name}</p>
                    <Badge variant="destructive" className="text-[10px] shrink-0">Out</Badge>
                  </div>
                ))}
                {lowStock.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-sm truncate flex-1">{p.name}</p>
                    <span className="text-xs font-semibold text-amber-600 shrink-0">{p.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-balance">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map((sale) => {
                  const method = PAYMENT_METHODS.find((m) => m.id === sale.payment_method);
                  return (
                    <div key={sale.id} className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sale.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground">{method?.label ?? sale.payment_method}</p>
                      </div>
                      <p className="text-sm font-bold text-primary shrink-0 mono">{formatCurrency(Number(sale.total))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
