import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Loader2, ShieldCheck, Store, Users,
  ChevronRight, KeyRound, Building2, User, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

type LoginRole = 'owner' | 'admin' | 'staff';

// Key used to persist the active staff session across page reloads
export const STAFF_SESSION_KEY = 'atustoka_staff_session';

const ROLE_OPTIONS: { key: LoginRole; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    key: 'owner',
    icon: <Store className="h-5 w-5" />,
    title: 'Business Owner',
    desc: 'Manage your store, sales & inventory',
  },
  {
    key: 'admin',
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Administrator',
    desc: 'Platform access — authorized accounts only',
  },
  {
    key: 'staff',
    icon: <Users className="h-5 w-5" />,
    title: 'Staff / Employee',
    desc: 'Sign in with your name and store PIN',
  },
];

// ── Green gradient background wrapper ────────────────────────────────────────
function GreenBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative w-full flex flex-col items-center">{children}</div>
    </div>
  );
}

// ── Logo + brand header ───────────────────────────────────────────────────────
function BrandHeader({ size = 64 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <Logo size={size} withText={false} />
      <div className="mt-3 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AtuStoka</h1>
        <p className="text-green-300 text-sm font-medium tracking-widest uppercase mt-0.5">Point of Sale</p>
      </div>
    </div>
  );
}

// ── Main Login component ──────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const { signIn, signOut } = useAuth();
  const [role, setRole] = useState<LoginRole | null>(null);

  // Owner / Admin form state
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // Staff form state
  const [bizName, setBizName]       = useState('');
  const [staffName, setStaffName]   = useState('');
  const [staffPin, setStaffPin]     = useState('');
  const [staffLoading, setStaffLoad] = useState(false);

  // ── Owner / Admin login ──────────────────────────────────────────────────────
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }

    setLoading(true);
    const { error, isSuperAdmin } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      if (role === 'admin') {
        toast.error('Access denied — invalid credentials or unauthorized account');
      } else {
        toast.error(error.message || 'Invalid email or password');
      }
      return;
    }

    // If user selected Admin role but is not a superadmin, sign them out and deny
    if (role === 'admin' && !isSuperAdmin) {
      await signOut();
      toast.error('Access denied — this account does not have administrator privileges');
      return;
    }

    // Redirect: admins → /admin, owners → /
    if (isSuperAdmin) {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // ── Staff PIN login ──────────────────────────────────────────────────────────
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !staffName.trim() || !staffPin.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setStaffLoad(true);
    const { data, error } = await supabase.rpc('staff_pin_login', {
      p_business_name: bizName.trim(),
      p_staff_name:    staffName.trim(),
      p_pin:           staffPin.trim(),
    });
    setStaffLoad(false);

    if (error) { toast.error('Login failed — please try again'); return; }

    if (data?.error === 'store_not_found') {
      toast.error('Business name not found — check spelling');
      return;
    }
    if (data?.error === 'invalid_credentials') {
      toast.error('Incorrect name or PIN — check with your store owner');
      setStaffPin('');
      return;
    }

    localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify({
      staff: data.staff,
      store: data.store,
    }));

    toast.success(`Welcome, ${data.staff.name}! Redirecting to POS…`);
    setTimeout(() => navigate('/pos', { replace: true }), 600);
  };

  // ── Role selector ─────────────────────────────────────────────────────────────
  if (!role) {
    return (
      <GreenBg>
        <div className="w-full max-w-sm">
          <BrandHeader />
          <div className="space-y-3">
            <p className="text-center text-green-200 text-sm font-medium mb-4">Who are you signing in as?</p>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-left group"
              >
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white/30 transition-colors">
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{r.title}</p>
                  <p className="text-xs text-green-200/80 mt-0.5 text-pretty">{r.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/50 shrink-0" />
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-green-200/60">
            New to AtuStoka?{' '}
            <Link to="/register" className="text-green-200 font-semibold hover:text-white underline">
              Register your business
            </Link>
          </p>
        </div>
      </GreenBg>
    );
  }

  // ── Staff PIN login form ──────────────────────────────────────────────────────
  if (role === 'staff') {
    return (
      <GreenBg>
        <div className="w-full max-w-sm">
          <BrandHeader size={56} />
          <Card className="border-0 shadow-2xl bg-white/95">
            <CardHeader className="pb-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-balance">Staff Login</CardTitle>
              <CardDescription className="text-pretty">
                Enter your store name, your name, and the PIN given to you by your store owner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz" className="text-sm font-normal flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Store / Business Name
                  </Label>
                  <Input id="biz" value={bizName} onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Shikongo Spaza Shop" className="h-11 px-3" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sname" className="text-sm font-normal flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Your Name
                  </Label>
                  <Input id="sname" value={staffName} onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Jonas Shikongo" className="h-11 px-3" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spin" className="text-sm font-normal flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Your PIN
                  </Label>
                  <Input id="spin" type="password" inputMode="numeric" maxLength={8}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Enter your PIN"
                    className="h-11 px-3 font-mono tracking-[0.5em] text-center text-lg"
                    autoComplete="off" />
                  <p className="text-[11px] text-muted-foreground">
                    Your PIN was given to you when you were added as staff. Ask your store owner if you don&apos;t have it.
                  </p>
                </div>
                <Button type="submit" className="w-full h-11 font-semibold text-base"
                  style={{ background: '#166534' }} disabled={staffLoading}>
                  {staffLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
                    : 'Sign In to POS'}
                </Button>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-800 text-pretty">
                    <strong>No PIN yet?</strong> Ask your store owner to add you in the{' '}
                    <em>Staff</em> section. Your PIN will be shown when they add you.
                  </p>
                </div>
                <Button variant="outline" className="w-full h-10" onClick={() => setRole(null)}>
                  ← Back to role selection
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </GreenBg>
    );
  }

  // ── Owner / Admin email + password ────────────────────────────────────────────
  const isAdmin = role === 'admin';

  return (
    <GreenBg>
      <div className="w-full max-w-md">
        <BrandHeader />
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <button onClick={() => setRole(null)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 mb-2 w-fit">
              ← Change role
            </button>
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                {isAdmin ? <ShieldCheck className="h-4 w-4 text-amber-600" /> : <Store className="h-4 w-4 text-primary" />}
              </div>
              <CardTitle className="text-xl font-bold text-balance">
                {isAdmin ? 'Administrator Login' : 'Owner Login'}
              </CardTitle>
            </div>
            <CardDescription className="text-pretty">
              {isAdmin
                ? 'Restricted to authorized platform administrator accounts only'
                : 'Enter your registered email and password to manage your store'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              {/* Admin info banner */}
              {isAdmin && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-amber-900 font-semibold">Platform Administrator Access</p>
                    <p className="text-xs text-amber-800 mt-0.5 text-pretty">
                      Use your assigned administrator email (Gmail or @atustoka.com) and password.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-normal">
                  {isAdmin ? 'Email address' : 'Phone number or email'}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="text"
                    inputMode={isAdmin ? 'email' : 'text'}
                    placeholder={isAdmin ? 'admin@gmail.com or name@atustoka.com' : '0811234567 or owner@store.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    className="h-11 px-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-normal">Password</Label>
                  {!isAdmin && (
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 px-3 pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-base"
                style={{ background: isAdmin ? '#92400e' : '#166534' }}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                  : isAdmin ? 'Sign In as Administrator' : 'Sign In'}
              </Button>

              {!isAdmin && (
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    Register your store
                  </Link>
                </p>
              )}
            </form>

            <p className="mt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
              By signing in you agree to our{' '}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </GreenBg>
  );
}
