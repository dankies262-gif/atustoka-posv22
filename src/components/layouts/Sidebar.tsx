import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Receipt,
  BarChart3, RotateCcw, CreditCard, History, UserCog,
  LogOut, Wifi, WifiOff, ChevronRight, Store, ShieldCheck,
  ChevronsUpDown, Plus, Check, Share2, UserPlus, Play, CloudUpload, Loader2,
  BookOpen
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { getInitials } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface NavItem { to: string; icon: React.ReactNode; label: string; }

const NAV_MAIN: NavItem[] = [
  { to: '/',             icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
  { to: '/pos',          icon: <ShoppingCart className="h-4 w-4" />,    label: 'Point of Sale' },
  { to: '/inventory',    icon: <Package className="h-4 w-4" />,         label: 'Inventory' },
  { to: '/customers',    icon: <Users className="h-4 w-4" />,           label: 'Customers' },
  { to: '/expenses',     icon: <Receipt className="h-4 w-4" />,         label: 'Expenses' },
  { to: '/reports',      icon: <BarChart3 className="h-4 w-4" />,       label: 'Reports' },
];

const NAV_MGMT: NavItem[] = [
  { to: '/returns',      icon: <RotateCcw className="h-4 w-4" />,  label: 'Returns' },
  { to: '/credits',      icon: <CreditCard className="h-4 w-4" />, label: 'Store Credits' },
  { to: '/stock-history',icon: <History className="h-4 w-4" />,    label: 'Stock History' },
  { to: '/staff',        icon: <UserCog className="h-4 w-4" />,    label: 'Staff' },
  { to: '/my-stores',    icon: <Store className="h-4 w-4" />,      label: 'My Stores' },
  { to: '/tutorials',    icon: <BookOpen className="h-4 w-4" />,   label: 'Tutorials' },
];

import { STAFF_SESSION_KEY } from '@/pages/auth/Login';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, store, stores, isSuperAdmin, switchStore, signOut } = useAuth();
  const navigate = useNavigate();
  const { isOnline, pendingChanges, isSyncing } = useSyncStatus();

  const staffSession = (() => {
    try {
      const raw = localStorage.getItem(STAFF_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const isStaffSession = !!(staffSession?.staff?.id && staffSession?.store?.id) && !user;

  const handleSignOut = async () => {
    if (isStaffSession) {
      localStorage.removeItem(STAFF_SESSION_KEY);
      toast.success('Staff signed out');
      navigate('/login', { replace: true });
      onClose?.();
      return;
    }
    await signOut();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
    onClose?.();
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-green-400'
        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    }`;

  return (
    <div className="flex flex-col h-full bg-sidebar w-full overflow-hidden">
      {/* Logo & brand */}
      <div className="px-4 py-5 flex items-center gap-3">
        <Logo size={38} withText={false} bgColor="#166534" />
        <div className="min-w-0">
          <p className="text-white font-extrabold text-base leading-tight tracking-tight">AtuStoka</p>
          <p className="text-green-400 text-[10px] font-medium tracking-widest uppercase">POS System</p>
        </div>
      </div>

      {/* Store switcher / Store Info */}
      {isStaffSession ? (
        <div className="mx-3 mb-3">
          <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent border border-sidebar-border text-left">
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-xs font-semibold truncate">
                {staffSession?.store?.business_name ?? 'Store'}
              </p>
              <p className="text-sidebar-foreground/55 text-[10px] truncate">
                Staff: {staffSession?.staff?.name}
              </p>
            </div>
          </div>
        </div>
      ) : !isSuperAdmin && (
      <div className="mx-3 mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent border border-sidebar-border hover:bg-sidebar-accent/80 transition-colors text-left">
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground text-xs font-semibold truncate">
                  {store?.business_name ?? 'No store'}
                </p>
                <p className="text-sidebar-foreground/55 text-[10px] truncate">
                  {store ? `${store.business_type} · ${store.region}` : 'Select a store'}
                </p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {stores.map(s => (
              <DropdownMenuItem
                key={s.id}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => { switchStore(s.id); onClose?.(); }}
              >
                <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{s.business_name}</span>
                {s.id === store?.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-primary"
              onClick={() => { navigate('/my-stores'); onClose?.(); }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add / Manage Stores</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}

      {/* Admin identity badge */}
      {isSuperAdmin && (
        <div className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30">
          <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-indigo-300 text-xs font-semibold truncate">Platform Administrator</p>
            <p className="text-indigo-400/60 text-[10px] truncate">atustoka.com.na</p>
          </div>
        </div>
      )}

      <Separator className="bg-sidebar-border mx-3 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {/* Navigation — hidden for superadmins */}
        {isStaffSession ? (
          <>
            <NavLink to="/pos" className={linkClass} onClick={onClose}><span className="shrink-0"><ShoppingCart className="h-4 w-4" /></span><span className="truncate">Point of Sale</span></NavLink>
            <NavLink to="/inventory" className={linkClass} onClick={onClose}><span className="shrink-0"><Package className="h-4 w-4" /></span><span className="truncate">Inventory</span></NavLink>
            <NavLink to="/customers" className={linkClass} onClick={onClose}><span className="shrink-0"><Users className="h-4 w-4" /></span><span className="truncate">Customers</span></NavLink>
          </>
        ) : !isSuperAdmin ? (
          NAV_MAIN.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
              onClick={onClose}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))
        ) : null}

        {!isSuperAdmin && !isStaffSession && (
          <>
          <div className="pt-2 pb-1">
            <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Management</p>
          </div>
          {NAV_MGMT.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={onClose}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            </NavLink>
          ))}
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="px-3 text-[10px] font-semibold text-indigo-300/70 uppercase tracking-wider">Platform Admin</p>
            </div>
            <NavLink to="/admin" end className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-200 border-l-2 border-indigo-400'
                  : 'text-indigo-300/80 hover:bg-indigo-500/10 hover:text-indigo-200'
              }`
            } onClick={onClose}>
              <span className="shrink-0"><LayoutDashboard className="h-4 w-4" /></span>
              <span className="truncate">Admin Dashboard</span>
            </NavLink>
            <NavLink to="/admin/panel" className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-200 border-l-2 border-indigo-400'
                  : 'text-indigo-300/80 hover:bg-indigo-500/10 hover:text-indigo-200'
              }`
            } onClick={onClose}>
              <span className="shrink-0"><ShieldCheck className="h-4 w-4" /></span>
              <span className="truncate">User &amp; Store Panel</span>
            </NavLink>
            <NavLink to="/admin/panel?tab=signups" className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-200 border-l-2 border-indigo-400'
                  : 'text-indigo-300/80 hover:bg-indigo-500/10 hover:text-indigo-200'
              }`
            } onClick={onClose}>
              <span className="shrink-0"><UserPlus className="h-4 w-4" /></span>
              <span className="truncate">Signup Activity</span>
            </NavLink>
          </>
        )}

        {/* Share / Advertise */}
        <div className="pt-2 pb-1">
          <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Grow</p>
        </div>
        <NavLink to="/how-it-works" className={linkClass} onClick={onClose}>
          <span className="shrink-0"><Play className="h-4 w-4" /></span>
          <span className="truncate">How It Works</span>
        </NavLink>
        <NavLink to="/advertise" className={linkClass} onClick={onClose}>
          <span className="shrink-0"><Share2 className="h-4 w-4" /></span>
          <span className="truncate">Share AtuStoka</span>
        </NavLink>
      </nav>

      <Separator className="bg-sidebar-border mx-3 mt-2" />

      {/* Sync status */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            isSyncing ? (
              <><Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" /><span className="text-[11px] text-blue-400">Syncing...</span></>
            ) : (
              <><Wifi className="h-3.5 w-3.5 text-green-400" /><span className="text-[11px] text-green-400">Synced</span></>
            )
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-amber-400" /><span className="text-[11px] text-amber-400">Offline mode</span></>
          )}
        </div>
        {!isOnline && pendingChanges > 0 && (
          <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full" title={`${pendingChanges} pending changes`}>
            <CloudUpload className="h-3 w-3 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-500">{pendingChanges}</span>
          </div>
        )}
      </div>

      {/* User profile */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-sidebar-accent/50">
          <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(user?.user_metadata?.ownerName || user?.email || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-semibold truncate">
              {user?.user_metadata?.ownerName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-sidebar-foreground/50 text-[10px] truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

