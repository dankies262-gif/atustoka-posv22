import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Store, ShieldCheck, TrendingUp, Search,
  Loader2, RefreshCw, Package, UserCog, ChevronDown,
  AlertTriangle, Activity, UserPlus, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// ── types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;          // mapped from usr_id
  email: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
  store_count: number;
  latest_store_name: string | null;
  latest_store_type: string | null;
}

interface AdminStore {
  id: string;          // mapped from store_id
  business_name: string;
  business_type: string;
  region: string;
  owner_email: string | null;
  owner_name: string | null;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_stores: number;
  total_sales: number;
  total_products: number;
  errors_today: number;
  new_today: number;
  new_this_week: number;
}

interface SignupPoint { signup_date: string; count: number }
interface ErrorLog { id: string; user_email: string | null; error_type: string; message: string; page: string | null; created_at: string }

type Tab = 'users' | 'stores' | 'signups' | 'errors';

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground leading-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user: currentUser, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const VALID_TABS: Tab[] = ['users', 'stores', 'signups', 'errors'];
  const paramTab = new URLSearchParams(location.search).get('tab') as Tab | null;

  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [stores, setStores]         = useState<AdminStore[]>([]);
  const [signups, setSignups]       = useState<SignupPoint[]>([]);
  const [errors, setErrors]         = useState<ErrorLog[]>([]);
  const [stats, setStats]           = useState<Stats>({
    total_users: 0, total_stores: 0, total_sales: 0,
    total_products: 0, errors_today: 0, new_today: 0, new_this_week: 0,
  });
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState<Tab>(
    paramTab && VALID_TABS.includes(paramTab) ? paramTab : 'users'
  );
  const [roleChange, setRoleChange] = useState<{ user: AdminUser; newRole: string } | null>(null);
  const [promoting, setPromoting]   = useState(false);

  // Sync tab when URL ?tab= param changes (sidebar shortcut re-click)
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab') as Tab | null;
    if (t && VALID_TABS.includes(t)) setTab(t);
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect non-superadmins
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      toast.error('Access denied — admin only');
      navigate('/', { replace: true });
    }
  }, [authLoading, isSuperAdmin, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, usersRes, storesRes, signupsRes, errorsRes] = await Promise.all([
        supabase.rpc('get_platform_stats'),
        supabase.rpc('get_admin_user_overview'),
        supabase.rpc('get_admin_stores_overview'),
        supabase.rpc('get_signup_timeline'),
        supabase.rpc('get_recent_error_logs', { limit_count: 100 }),
      ]);

      if (statsRes.error)   throw new Error(`Stats: ${statsRes.error.message}`);
      if (usersRes.error)   throw new Error(`Users: ${usersRes.error.message}`);
      if (storesRes.error)  throw new Error(`Stores: ${storesRes.error.message}`);
      if (signupsRes.error) console.warn('Signups RPC:', signupsRes.error.message);
      if (errorsRes.error)  console.warn('Errors RPC:', errorsRes.error.message);

      setStats(statsRes.data as Stats);

      // Remap RPC aliases → frontend interface field names
      const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(rawUsers.map((u: Record<string, unknown>) => ({
        id:                u.usr_id   ?? u.id,
        email:             u.email,
        full_name:         u.full_name,
        role:              u.role,
        created_at:        u.created_at,
        store_count:       Number(u.store_count ?? 0),
        latest_store_name: u.latest_store_name ?? null,
        latest_store_type: u.latest_store_type ?? null,
      })) as AdminUser[]);

      const rawStores = Array.isArray(storesRes.data) ? storesRes.data : [];
      setStores(rawStores.map((s: Record<string, unknown>) => ({
        id:            s.store_id  ?? s.id,
        business_name: s.business_name,
        business_type: s.business_type,
        region:        s.region,
        owner_email:   s.owner_email ?? null,
        owner_name:    s.owner_name  ?? null,
        created_at:    s.created_at,
      })) as AdminStore[]);

      const rawSignups = Array.isArray(signupsRes.data) ? signupsRes.data : [];
      setSignups(rawSignups.map((r: Record<string, unknown>) => ({
        signup_date: r.signup_date as string,
        count:       Number(r.cnt ?? r.count ?? 0),
      })));

      const rawErrors = Array.isArray(errorsRes.data) ? errorsRes.data : [];
      setErrors(rawErrors.map((e: Record<string, unknown>) => ({
        id:         e.log_id   ?? e.id,
        user_email: e.user_email ?? null,
        error_type: e.error_type,
        message:    e.message,
        page:       e.page ?? null,
        created_at: e.created_at,
      })) as ErrorLog[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Admin panel load error:', msg);
      setLoadError(msg);
      toast.error(`Failed to load admin data: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isSuperAdmin) loadData(); }, [isSuperAdmin, loadData]);

  const handleRoleChange = async () => {
    if (!roleChange) return;
    setPromoting(true);
    const { data, error } = await supabase.rpc('set_user_role', {
      p_target_user_id: roleChange.user.id,
      p_new_role:       roleChange.newRole,
    });
    if (error) {
      toast.error(`Failed to update role: ${error.message}`);
    } else if (data?.error === 'max_admins_reached') {
      toast.error(`Maximum of 5 administrators reached. Remove an existing admin first.`);
    } else if (data?.error === 'unauthorized') {
      toast.error('You are not authorized to change roles.');
    } else {
      toast.success(
        roleChange.newRole === 'superadmin'
          ? `${roleChange.user.email} promoted to Administrator`
          : `${roleChange.user.email} set back to regular user`
      );
      await loadData();
    }
    setPromoting(false);
    setRoleChange(null);
  };

  const dismissError = async (id: string) => {
    await supabase.from('error_logs').delete().eq('id', id);
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  // fill signup chart gaps (last 14 days)
  const signupChartData = (() => {
    const map: Record<string, number> = {};
    signups.forEach(s => { map[s.signup_date] = Number(s.count); });
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      out.push({ date: d.toLocaleDateString('en-NA', { month: 'short', day: 'numeric' }), signups: map[key] ?? 0 });
    }
    return out;
  })();

  const filteredUsers = users.filter(u =>
    !search ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredStores = stores.filter(s =>
    !search ||
    s.business_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.owner_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.owner_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredErrors = errors.filter(e =>
    !search ||
    (e.message ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.user_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.page ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || !isSuperAdmin) return null;

  const TABS: { key: Tab; icon: React.ReactNode; label: string; count?: number }[] = [
    { key: 'users',   icon: <Users className="h-3.5 w-3.5" />,         label: 'Users',    count: stats.total_users },
    { key: 'stores',  icon: <Store className="h-3.5 w-3.5" />,         label: 'Stores',   count: stats.total_stores },
    { key: 'signups', icon: <Activity className="h-3.5 w-3.5" />,      label: 'Signups' },
    { key: 'errors',  icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Errors',   count: stats.errors_today },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Platform overview — all AtuStoka accounts</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      </div>

      {/* ── Load-error banner ── */}
      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">Failed to load admin data</p>
            <p className="text-xs text-destructive/80 mt-0.5 break-words">{loadError}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure your account has <strong>superadmin</strong> role and try refreshing.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="shrink-0 h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />}         label="Registered Users"  value={stats.total_users}    color="bg-primary/10"    sub={`+${stats.new_today} today`} />
        <StatCard icon={<Store className="h-5 w-5 text-teal-600" />}        label="Total Stores"      value={stats.total_stores}   color="bg-teal-500/10"   sub={`${stats.new_this_week} stores this week`} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-amber-600" />}  label="Sales Processed"   value={stats.total_sales}    color="bg-amber-500/10" />
        <StatCard icon={<Package className="h-5 w-5 text-purple-600" />}    label="Active Products"   value={stats.total_products} color="bg-purple-500/10" />
      </div>

      {/* ── New users this week highlight ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={<UserPlus className="h-5 w-5 text-green-600" />}    label="New Signups Today"     value={stats.new_today}      color="bg-green-500/10" />
        <StatCard icon={<UserPlus className="h-5 w-5 text-blue-600" />}     label="Signups This Week"     value={stats.new_this_week}  color="bg-blue-500/10" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-600" />} label="Errors Today"          value={stats.errors_today}   color="bg-red-500/10"   sub="client-side errors logged" />
      </div>

      {/* ── Main table card ── */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`ml-0.5 text-xs rounded-full px-1.5 py-0 leading-5 ${tab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Search — hidden for signups tab */}
            {tab !== 'signups' && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 px-0 pb-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>

          /* ── Users table ── */
          ) : tab === 'users' ? (
            <div className="overflow-x-auto">
              {/* Admin count banner */}
              {(() => {
                const adminCount = users.filter(u => u.role === 'superadmin').length;
                return (
                  <div className={`mx-4 mt-4 mb-2 rounded-lg px-4 py-2.5 flex items-center gap-3 ${adminCount >= 5 ? 'bg-amber-50 border border-amber-200' : 'bg-primary/5 border border-primary/20'}`}>
                    <ShieldCheck className={`h-4 w-4 shrink-0 ${adminCount >= 5 ? 'text-amber-600' : 'text-primary'}`} />
                    <p className={`text-xs font-medium ${adminCount >= 5 ? 'text-amber-800' : 'text-primary'}`}>
                      {adminCount} / 5 administrator slots used
                      {adminCount >= 5 && ' — remove an admin before promoting another user'}
                    </p>
                    <div className="flex gap-1 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-2 w-5 rounded-full ${i < adminCount ? (adminCount >= 5 ? 'bg-amber-500' : 'bg-primary') : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                );
              })()}
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border">
                    {['#','Email','Name','Role','Stores','Latest Store','Joined',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">No users found</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{i + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="font-mono text-xs">{u.email}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{u.full_name ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.role === 'superadmin'
                          ? <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1"><ShieldCheck className="h-2.5 w-2.5" />Admin</Badge>
                          : <Badge variant="outline" className="text-[10px]">User</Badge>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold">{u.store_count}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {u.latest_store_name
                          ? <><span className="text-foreground">{u.latest_store_name}</span> <span className="text-[10px]">({u.latest_store_type})</span></>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                                <UserCog className="h-3 w-3" /><ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.role !== 'superadmin' ? (
                                <DropdownMenuItem
                                  className={users.filter(x => x.role === 'superadmin').length >= 5
                                    ? 'cursor-not-allowed opacity-50 gap-2'
                                    : 'text-primary cursor-pointer gap-2'}
                                  onClick={() => {
                                    if (users.filter(x => x.role === 'superadmin').length >= 5) {
                                      toast.error('Maximum of 5 administrators reached. Remove one first.');
                                    } else {
                                      setRoleChange({ user: u, newRole: 'superadmin' });
                                    }
                                  }}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" /> Promote to Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-destructive cursor-pointer gap-2" onClick={() => setRoleChange({ user: u, newRole: 'user' })}>
                                  <UserCog className="h-3.5 w-3.5" /> Remove Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          /* ── Stores table ── */
          ) : tab === 'stores' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border">
                    {['#','Store Name','Type','Region','Owner','Email','Created'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">No stores found</td></tr>
                  ) : filteredStores.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{i + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-sm">{s.business_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant="outline" className="text-[10px]">{s.business_type}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{s.region}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{s.owner_name ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="font-mono text-xs text-muted-foreground">{s.owner_email ?? '—'}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          /* ── Signups chart ── */
          ) : tab === 'signups' ? (
            <div className="px-4 pb-4 space-y-4">
              <CardTitle className="text-sm font-semibold text-balance">New User Signups — Last 14 Days</CardTitle>
              <div className="w-full min-w-0 overflow-hidden h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={signupChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#166534" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#166534" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Signups']} />
                    <Area type="monotone" dataKey="signups" stroke="#166534" strokeWidth={2} fill="url(#signupGrad)" dot={{ r: 3, fill: '#166534' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Signup list */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['#','Email','Name','Role','Stores','Business Name','Type','Region','Joined'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((u, i) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className="font-mono text-xs">{u.email}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{u.full_name ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.role === 'superadmin'
                            ? <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1"><ShieldCheck className="h-2.5 w-2.5" />Admin</Badge>
                            : <Badge variant="outline" className="text-[10px]">User</Badge>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold">{u.store_count}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {u.latest_store_name ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.latest_store_type
                            ? <Badge variant="outline" className="text-[10px]">{u.latest_store_type}</Badge>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{u.latest_store_name ? (stores.find(s => s.business_name === u.latest_store_name)?.region ?? '—') : '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          /* ── Error logs ── */
          ) : (
            <div className="overflow-x-auto">
              {filteredErrors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShieldCheck className="h-10 w-10 text-green-500/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No errors logged — platform looks healthy!</p>
                </div>
              ) : (
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['Time','User','Type','Message','Page',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredErrors.map(e => (
                      <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs">{e.user_email ?? 'anonymous'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{e.error_type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs">
                          <p className="truncate text-foreground">{e.message}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{e.page ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => dismissError(e.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          <div className="h-4" />
        </CardContent>
      </Card>

      {/* Role change confirmation */}
      <AlertDialog open={!!roleChange} onOpenChange={() => setRoleChange(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleChange?.newRole === 'superadmin' ? 'Promote to Admin?' : 'Remove Admin Access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleChange?.newRole === 'superadmin'
                ? `${roleChange.user.email} will gain full Admin Panel access and platform-wide visibility.`
                : `${roleChange?.user.email} will lose Admin Panel access and become a regular user.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={promoting}
              className={roleChange?.newRole !== 'superadmin' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {promoting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {roleChange?.newRole === 'superadmin' ? 'Promote' : 'Remove Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
