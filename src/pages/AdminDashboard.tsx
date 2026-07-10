import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Store, ShieldCheck,
  UserPlus, RefreshCw, Loader2,
  Eye, EyeOff, Lock, Search, Filter,
  CheckCircle2, XCircle, LogOut, Camera, X, Copy, Clock,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BUSINESS_TYPES, REGIONS } from '@/lib/constants';

// ── types ─────────────────────────────────────────────────────────────────────
interface PlatformStats {
  total_accounts: number;
  active_accounts: number;
  deactivated_accounts: number;
  total_stores: number;
  expired_subscriptions: number;
}

interface AccountRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
  is_system_admin: boolean;
  avatar_url: string | null;
  created_at: string;
  subscription_expires_at: string | null;
  store_count: number;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, colorClass,
}: {
  icon: React.ReactNode; label: string; value: number; colorClass: string;
}) {
  return (
    <Card className="h-full border-indigo-100 bg-white">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-extrabold text-indigo-900 leading-tight">{value.toLocaleString()}</p>
          <p className="text-sm text-indigo-400 truncate mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── PIN input field ───────────────────────────────────────────────────────────
function PinField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <Input
      type="password"
      inputMode="numeric"
      maxLength={5}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
      placeholder={placeholder ?? '\u2022 \u2022 \u2022 \u2022 \u2022'}
      autoComplete="off"
      className="h-11 px-3 font-mono tracking-[0.8em] text-center text-lg"
    />
  );
}

// ── Avatar picker (shared) ────────────────────────────────────────────────────
function AvatarPickerField({ preview, onFileChange, onRemove }: {
  preview: string | null; onFileChange: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-normal">Profile photo <span className="text-destructive">*</span></Label>
      <div className="flex items-center gap-3">
        {preview ? (
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-200 shrink-0">
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            <button type="button" onClick={onRemove}
              className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600">
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div onClick={() => ref.current?.click()}
            className="h-14 w-14 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors shrink-0">
            <Camera className="h-5 w-5 text-indigo-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Button type="button" variant="outline" size="sm"
            className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={() => ref.current?.click()}>
            {preview ? 'Change' : 'Upload'}
          </Button>
          <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG or WEBP \u00b7 max 2MB</p>
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
            onFileChange(file);
          }} />
      </div>
    </div>
  );
}

// ── PIN reveal modal ──────────────────────────────────────────────────────────
function PinRevealModal({ open, pin, onClose }: { open: boolean; pin: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(pin).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-balance text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" /> Admin Account Created
          </DialogTitle>
          <DialogDescription className="text-pretty">
            The new admin\u2019s auto-generated PIN is shown below. Share it securely \u2014 it\u2019s shown <strong>only once</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-5 text-center">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Admin PIN</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-extrabold text-indigo-800 font-mono tracking-[0.3em]">{pin}</span>
            <button onClick={handleCopy}
              className="h-8 w-8 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors">
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-indigo-600" />}
            </button>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800 text-pretty">
            Share this PIN with the new admin directly and securely. It cannot be retrieved later.
          </p>
        </div>
        <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={onClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Change PIN modal ──────────────────────────────────────────────────────────
function ChangePinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [curr, setCurr] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [loading, setLoading] = useState(false);
  const reset = () => { setCurr(''); setNext(''); setConf(''); };
  const handleClose = () => { reset(); onClose(); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length !== 5) { toast.error('New PIN must be exactly 5 digits'); return; }
    if (next !== conf)     { toast.error('New PINs do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.rpc('change_admin_pin', { p_current_pin: curr, p_new_pin: next });
      if (error) throw error;
      toast.success('PIN changed successfully');
      handleClose();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-balance">
            <Lock className="h-4 w-4 text-indigo-600 shrink-0" /> Change Admin PIN
          </DialogTitle>
          <DialogDescription className="text-pretty">Enter your current PIN then choose a new 5-digit PIN.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Current PIN <span className="text-destructive">*</span></Label>
            <PinField value={curr} onChange={setCurr} placeholder="Current PIN" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">New PIN <span className="text-destructive">*</span></Label>
            <PinField value={next} onChange={setNext} placeholder="New PIN" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Confirm new PIN <span className="text-destructive">*</span></Label>
            <PinField value={conf} onChange={setConf} placeholder="Confirm PIN" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving\u2026</> : 'Save PIN'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Deactivate confirm modal ──────────────────────────────────────────────────
function DeactivateModal({ open, onClose, account, onSuccess }: {
  open: boolean; onClose: () => void; account: AccountRow | null; onSuccess: (id: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const reset = () => setPin('');
  const handleClose = () => { reset(); onClose(); };
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (pin.length !== 5) { toast.error('Enter your 5-digit PIN'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-toggle-user-status', {
        body: { user_id: account.id, action: 'deactivate', pin },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        throw new Error(msg || error.message);
      }
      toast.success(`${account.full_name ?? account.email} has been deactivated`);
      onSuccess(account.id);
      handleClose();
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-balance text-red-600">
            <XCircle className="h-4 w-4 shrink-0" /> Confirm Deactivation
          </DialogTitle>
          <DialogDescription className="text-pretty">This will prevent the user from logging in. Enter your admin PIN to confirm.</DialogDescription>
        </DialogHeader>
        {account && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
            <p className="font-semibold text-red-800">{account.full_name ?? '\u2014'}</p>
            <p className="text-red-600 font-mono text-xs mt-0.5">{account.email}</p>
          </div>
        )}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Your admin PIN <span className="text-destructive">*</span></Label>
            <PinField value={pin} onChange={setPin} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deactivating\u2026</> : 'Deactivate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Admin modal (System Administrator only) ───────────────────────────────
function AddAdminModal({ open, onClose, onPinGenerated }: {
  open: boolean; onClose: () => void; onPinGenerated: (pin: string) => void;
}) {
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const reset = () => {
    setFullName(''); setEmail(''); setPassword(''); setConfirmPw('');
    setShowPw(false); setAvatarFile(null); setAvatarPreview(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required'); return; }
    if (!email.trim())    { toast.error('Email address is required'); return; }
    const emailLc = email.trim().toLowerCase();
    if (!emailLc.endsWith('@gmail.com') && !emailLc.endsWith('@atustoka.com')) {
      toast.error('Only Gmail or @atustoka.com addresses allowed for admins'); return;
    }
    if (!avatarFile)      { toast.error('Profile photo is required'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPw) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      // Create user directly via edge function (uses service role internally)
      // We upload avatar after getting user_id back
      const { data: result, error: fnErr } = await supabase.functions.invoke('admin-create-account', {
        body: { type: 'admin', full_name: fullName.trim(), email: emailLc, password },
      });
      if (fnErr) {
        const msg = await fnErr?.context?.text?.();
        throw new Error(msg || fnErr.message);
      }

      const userId: string = result?.user_id;
      const pin: string    = result?.generated_pin;
      if (!userId || !pin) throw new Error('Account creation failed');

      // Upload avatar using service-role won\u2019t work client-side — use anon client with storage policy
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const filePath = `${userId}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadErr) throw new Error(`Avatar upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from('admin-avatars').getPublicUrl(filePath);
      // Update profile with avatar_url
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', userId);

      reset();
      onClose();
      onPinGenerated(pin);
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-balance">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" /> Add Administrator
          </DialogTitle>
          <DialogDescription className="text-pretty">
            Create a new admin account. A unique 5-digit PIN will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <AvatarPickerField preview={avatarPreview} onFileChange={handleFileChange}
            onRemove={() => { setAvatarFile(null); setAvatarPreview(null); }} />
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Full name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Jane Admin" value={fullName} onChange={e => setFullName(e.target.value)} className="h-10 px-3" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Email address <span className="text-destructive">*</span></Label>
            <Input type="email" placeholder="name@gmail.com or name@atustoka.com" value={email}
              onChange={e => setEmail(e.target.value)} className="h-10 px-3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars" value={password}
                  onChange={e => setPassword(e.target.value)} className="h-10 px-3 pr-9" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Confirm <span className="text-destructive">*</span></Label>
              <Input type="password" placeholder="Re-enter" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} className="h-10 px-3" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating\u2026</> : 'Create & Get PIN'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Account Modal (Admin + Owner) ──────────────────────────────────────
function CreateAccountModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: (pin?: string) => void;
}) {
  const [type, setType]               = useState<'admin' | 'owner'>('owner');
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [bizName, setBizName]         = useState('');
  const [bizType, setBizType]         = useState('');
  const [region, setRegion]           = useState('');
  const [town, setTown]               = useState('');
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const reset = () => {
    setType('owner'); setFullName(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPw(''); setBizName(''); setBizType('');
    setRegion(''); setTown(''); setShowPw(false);
    setAvatarFile(null); setAvatarPreview(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required'); return; }
    if (!email.trim())    { toast.error('Email address is required'); return; }
    const emailLc = email.trim().toLowerCase();
    if (type === 'admin') {
      if (!emailLc.endsWith('@gmail.com') && !emailLc.endsWith('@atustoka.com')) {
        toast.error('Admin accounts require Gmail or @atustoka.com'); return;
      }
      if (!avatarFile) { toast.error('Profile photo is required for admin accounts'); return; }
    }
    if (type === 'owner' && !phone.trim()) { toast.error('Phone number is required'); return; }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (type === 'owner') {
      if (!bizName.trim()) { toast.error('Business name is required'); return; }
      if (!bizType)        { toast.error('Please select a business type'); return; }
      if (!region)         { toast.error('Please select a region'); return; }
    }

    setLoading(true);
    try {
      let avatarUrl: string | undefined;

      // For admin: upload photo then call edge function
      if (type === 'admin' && avatarFile) {
        // Create admin account first to get user_id
        const { data: result, error: fnErr } = await supabase.functions.invoke('admin-create-account', {
          body: { type: 'admin', full_name: fullName.trim(), email: emailLc, password },
        });
        if (fnErr) { const msg = await fnErr?.context?.text?.(); throw new Error(msg || fnErr.message); }
        const userId: string = result?.user_id;
        const pin: string    = result?.generated_pin;
        if (!userId || !pin) throw new Error('Account creation failed');

        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const filePath = `${userId}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('admin-avatars')
          .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('admin-avatars').getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
        }
        reset(); onClose(); onSuccess(pin);
        return;
      }

      // For owner: standard flow
      const payload = { type: 'owner', full_name: fullName.trim(), email: emailLc, phone: phone.trim(),
        password, business_name: bizName.trim(), business_type: bizType, region, town: town.trim() || undefined };
      const { error } = await supabase.functions.invoke('admin-create-account', { body: payload });
      if (error) { const msg = await error?.context?.text?.(); throw new Error(msg || error.message); }
      toast.success('Business owner account created');
      reset(); onClose(); onSuccess();
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-balance">
            <UserPlus className="h-5 w-5 text-indigo-600 shrink-0" /> Create Account
          </DialogTitle>
          <DialogDescription className="text-pretty">
            Create a new administrator or business owner account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            {(['owner', 'admin'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  type === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'admin' ? 'Administrator' : 'Business Owner'}
              </button>
            ))}
          </div>

          {type === 'admin' && (
            <AvatarPickerField preview={avatarPreview} onFileChange={(f) => { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }}
              onRemove={() => { setAvatarFile(null); setAvatarPreview(null); }} />
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Full name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className="h-10 px-3" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Email address <span className="text-destructive">*</span></Label>
            <Input type="email" placeholder={type === 'admin' ? 'name@gmail.com' : 'user@example.com'}
              value={email} onChange={e => setEmail(e.target.value)} className="h-10 px-3" />
            {type === 'admin' && (
              <p className="text-[11px] text-indigo-500">Must be <span className="font-mono font-semibold">@gmail.com</span> or <span className="font-mono font-semibold">@atustoka.com</span></p>
            )}
          </div>

          {type === 'owner' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Phone number <span className="text-destructive">*</span></Label>
              <Input type="tel" placeholder="e.g. 0811234567" value={phone} onChange={e => setPhone(e.target.value)} className="h-10 px-3" />
            </div>
          )}

          {type === 'owner' && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Details</p>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Business name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Corner Store" value={bizName} onChange={e => setBizName(e.target.value)} className="h-10 px-3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Type <span className="text-destructive">*</span></Label>
                  <Select value={bizType} onValueChange={setBizType}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select\u2026" /></SelectTrigger>
                    <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Region <span className="text-destructive">*</span></Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select\u2026" /></SelectTrigger>
                    <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Town / City <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. Windhoek" value={town} onChange={e => setTown(e.target.value)} className="h-10 px-3" />
              </div>
            </>
          )}

          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars" value={password}
                  onChange={e => setPassword(e.target.value)} className="h-10 px-3 pr-9" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Confirm <span className="text-destructive">*</span></Label>
              <Input type="password" placeholder="Re-enter" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} className="h-10 px-3" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating\u2026</> : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate          = useNavigate();
  const { user, signOut } = useAuth();

  const [stats, setStats]         = useState<PlatformStats>({ total_accounts: 0, active_accounts: 0, deactivated_accounts: 0, total_stores: 0, expired_subscriptions: 0 });
  const [accounts, setAccounts]   = useState<AccountRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Current admin info
  const [adminName, setAdminName]     = useState('');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  // Filters
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreate, setShowCreate]         = useState(false);
  const [showAddAdmin, setShowAddAdmin]     = useState(false);
  const [showChangePinModal, setChangePin]  = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AccountRow | null>(null);
  const [revealPin, setRevealPin]           = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, is_system_admin')
          .eq('id', user.id)
          .maybeSingle();
        setAdminName(prof?.full_name ?? user.email ?? 'Admin');
        setAdminAvatar(prof?.avatar_url ?? null);
        setIsSystemAdmin(prof?.is_system_admin ?? false);
      }

      const { data: rows } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, is_system_admin, avatar_url, created_at, subscription_expires_at')
        .order('created_at', { ascending: false });

      const profileRows = Array.isArray(rows) ? rows : [];

      const { data: storeCounts } = await supabase.from('stores').select('owner_id');
      const countMap: Record<string, number> = {};
      (storeCounts ?? []).forEach((s: { owner_id: string }) => {
        countMap[s.owner_id] = (countMap[s.owner_id] ?? 0) + 1;
      });

      const enriched: AccountRow[] = profileRows.map((p) => ({
        id: p.id,
        email: p.email ?? '',
        full_name: p.full_name,
        role: p.role,
        is_active: p.is_active ?? true,
        is_system_admin: p.is_system_admin ?? false,
        avatar_url: p.avatar_url ?? null,
        created_at: p.created_at,
        subscription_expires_at: p.subscription_expires_at ?? null,
        store_count: countMap[p.id] ?? 0,
      }));

      setAccounts(enriched);

      const total       = enriched.length;
      const active      = enriched.filter(a => a.is_active).length;
      const totalStores = Object.values(countMap).reduce((a, b) => a + b, 0);
      const now         = new Date();
      const expired     = enriched.filter(a =>
        a.role !== 'superadmin' &&
        a.subscription_expires_at !== null &&
        new Date(a.subscription_expires_at) < now
      ).length;
      setStats({ total_accounts: total, active_accounts: active, deactivated_accounts: total - active, total_stores: totalStores, expired_subscriptions: expired });
    } catch (err) {
      console.error('AdminDashboard:', err);
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleActivate = async (account: AccountRow) => {
    try {
      const { error } = await supabase.functions.invoke('admin-toggle-user-status', {
        body: { user_id: account.id, action: 'activate' },
      });
      if (error) { const msg = await error?.context?.text?.(); throw new Error(msg || error.message); }
      toast.success(`${account.full_name ?? account.email} activated`);
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, is_active: true } : a));
      setStats(prev => ({ ...prev, active_accounts: prev.active_accounts + 1, deactivated_accounts: prev.deactivated_accounts - 1 }));
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    }
  };

  const handleRenewSubscription = async (account: AccountRow) => {
    try {
      // Extend subscription by 3 months from today (or from current expiry if still in future)
      const base = account.subscription_expires_at && new Date(account.subscription_expires_at) > new Date()
        ? new Date(account.subscription_expires_at)
        : new Date();
      const newExpiry = new Date(base.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_expires_at: newExpiry, is_active: true })
        .eq('id', account.id);
      if (error) throw new Error(error.message);

      // Also unban in auth if they were deactivated
      if (!account.is_active) {
        await supabase.functions.invoke('admin-toggle-user-status', {
          body: { user_id: account.id, action: 'activate' },
        });
      }

      toast.success(`Subscription renewed — ${account.full_name ?? account.email} is active for 3 more months`);
      setAccounts(prev => prev.map(a =>
        a.id === account.id ? { ...a, subscription_expires_at: newExpiry, is_active: true } : a
      ));
      fetchData();
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    }
  };

  const handleDeactivateSuccess = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, is_active: false } : a));
    setStats(prev => ({ ...prev, active_accounts: prev.active_accounts - 1, deactivated_accounts: prev.deactivated_accounts + 1 }));
  };

  const filtered = accounts.filter(a => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.email.toLowerCase().includes(q) && !(a.full_name ?? '').toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin' && a.role !== 'superadmin') return false;
      if (roleFilter === 'owner' && a.role === 'superadmin') return false;
    }
    if (statusFilter === 'active' && !a.is_active) return false;
    if (statusFilter === 'inactive' && a.is_active) return false;
    return true;
  });

  const handleLogout = async () => { await signOut(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-[#f0f1fa]">
      {/* ── Header ── */}
      <header className="bg-[#1e1b4b] text-white px-4 md:px-8 h-14 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight whitespace-nowrap">AtuStoka Admin</span>
          {/* Admin avatar + name */}
          <div className="hidden md:flex items-center gap-2 ml-3">
            {adminAvatar ? (
              <img src={adminAvatar} alt={adminName} className="h-7 w-7 rounded-full object-cover border border-indigo-400 shrink-0" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-indigo-400 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase">
                {adminName.charAt(0)}
              </div>
            )}
            <span className="text-indigo-300 text-xs font-mono truncate max-w-[160px]">{adminName}</span>
            {isSystemAdmin && (
              <Badge className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0 shrink-0">
                System Admin
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSystemAdmin && (
            <Button variant="ghost" size="sm"
              className="h-8 text-indigo-200 hover:text-white hover:bg-indigo-700 gap-1.5 text-xs font-medium"
              onClick={() => setShowAddAdmin(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Add Admin</span>
            </Button>
          )}
          <Button variant="ghost" size="sm"
            className="h-8 text-indigo-200 hover:text-white hover:bg-indigo-700 gap-1.5 text-xs font-medium"
            onClick={() => setChangePin(true)}>
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Change PIN</span>
          </Button>
          <Button variant="ghost" size="sm"
            className="h-8 text-indigo-200 hover:text-white hover:bg-indigo-700 gap-1.5 text-xs font-medium"
            onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-4 md:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Title + actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-indigo-900 text-balance">Platform Dashboard</h1>
            <p className="text-sm text-indigo-400 mt-0.5">Manage all accounts and monitor platform activity</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-9 gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </Button>
            <Button size="sm" className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={() => setShowCreate(true)}>
              <UserPlus className="h-4 w-4" /><span>Create Account</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="h-full border-indigo-100 bg-white animate-pulse">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-indigo-50 rounded w-16" />
                    <div className="h-3 bg-indigo-50 rounded w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={<Users className="h-5 w-5 text-indigo-600" />} label="Total Accounts" value={stats.total_accounts} colorClass="bg-indigo-50" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} label="Active Accounts" value={stats.active_accounts} colorClass="bg-green-50" />
            <StatCard icon={<XCircle className="h-5 w-5 text-red-500" />} label="Deactivated" value={stats.deactivated_accounts} colorClass="bg-red-50" />
            <StatCard icon={<Store className="h-5 w-5 text-amber-600" />} label="Total Stores" value={stats.total_stores} colorClass="bg-amber-50" />
            <StatCard icon={<Clock className="h-5 w-5 text-orange-600" />} label="Expired Subscriptions" value={stats.expired_subscriptions} colorClass="bg-orange-50" />
          </div>
        )}

        {/* Accounts table */}
        <Card className="border-indigo-100">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <CardTitle className="text-base font-semibold text-indigo-900 flex items-center gap-2 flex-1 min-w-0">
                <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                Users &amp; Accounts
                <Badge variant="outline" className="border-indigo-200 text-indigo-500 text-[10px] ml-1">
                  {filtered.length} shown
                </Badge>
              </CardTitle>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-300 pointer-events-none" />
                  <Input placeholder="Search name or email\u2026" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-8 pr-3 text-sm w-full md:w-52 border-indigo-200 focus:border-indigo-400" />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-9 w-32 border-indigo-200 text-sm">
                      <Filter className="h-3.5 w-3.5 text-indigo-400 mr-1.5" /><SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-32 border-indigo-200 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className="border-b border-indigo-50 bg-indigo-50/40">
                    {['Name', 'Email', 'Role', 'Status', 'Subscription', 'Stores', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-5 py-3"><div className="h-4 bg-indigo-50 rounded w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-indigo-300">No accounts match your search</td></tr>
                  ) : (
                    filtered.map(a => (
                      <tr key={a.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {a.avatar_url ? (
                              <img src={a.avatar_url} alt={a.full_name ?? ''} className="h-7 w-7 rounded-full object-cover border border-indigo-100 shrink-0" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0 uppercase">
                                {(a.full_name ?? a.email ?? '?').charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-indigo-900 truncate block max-w-[140px]">{a.full_name ?? '\u2014'}</span>
                              {a.is_system_admin && (
                                <span className="text-[10px] font-semibold text-amber-600">System Admin</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-indigo-500 font-mono text-xs whitespace-nowrap">{a.email}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {a.role === 'superadmin'
                            ? <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-semibold">Admin</Badge>
                            : <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold">Owner</Badge>}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {a.is_active
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </span>
                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                <XCircle className="h-3 w-3" /> Deactivated
                              </span>
                          }
                        </td>
                        {/* Subscription expiry */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          {a.role === 'superadmin' ? (
                            <span className="text-xs text-indigo-400 font-mono">No expiry</span>
                          ) : a.subscription_expires_at ? (() => {
                            const exp = new Date(a.subscription_expires_at);
                            const now = new Date();
                            const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const expired = daysLeft < 0;
                            const urgent  = daysLeft >= 0 && daysLeft <= 14;
                            return (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                                expired ? 'bg-red-50 text-red-600 border border-red-200'
                                : urgent ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                              }`}>
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                {expired ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                              </span>
                            );
                          })() : (
                            <span className="text-xs text-indigo-300 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-indigo-600 font-mono text-xs whitespace-nowrap text-center">{a.store_count}</td>
                        <td className="px-5 py-3 text-indigo-400 font-mono text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {a.is_active ? (
                              <Button size="sm" variant="outline"
                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold px-3"
                                onClick={() => setDeactivateTarget(a)}>
                                <XCircle className="h-3 w-3 mr-1" /> Deactivate
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline"
                                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-semibold px-3"
                                onClick={() => handleActivate(a)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Activate
                              </Button>
                            )}
                            {/* Renew subscription — visible for owner accounts */}
                            {a.role !== 'superadmin' && (
                              <Button size="sm" variant="outline"
                                className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-semibold px-3"
                                title="Extend subscription by 3 months"
                                onClick={() => handleRenewSubscription(a)}>
                                <Clock className="h-3 w-3 mr-1" /> Renew
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateAccountModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(pin) => { handleRefresh(); if (pin) setRevealPin(pin); }}
      />
      <AddAdminModal
        open={showAddAdmin}
        onClose={() => setShowAddAdmin(false)}
        onPinGenerated={(pin) => { handleRefresh(); setRevealPin(pin); }}
      />
      <ChangePinModal open={showChangePinModal} onClose={() => setChangePin(false)} />
      <DeactivateModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        account={deactivateTarget}
        onSuccess={handleDeactivateSuccess}
      />
      <PinRevealModal open={!!revealPin} pin={revealPin ?? ''} onClose={() => setRevealPin(null)} />
    </div>
  );
}
