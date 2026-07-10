import { useEffect, useState } from 'react';
import { Plus, Loader2, Copy, CheckCircle2, Key, Edit2, PowerOff, Power } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getStaff, createStaff, updateStaff } from '@/services/database';
import { ROLES, SHIFTS, ROLE_COLORS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Staff } from '@/types/database';

const EMPTY_FORM = { name: '', role: 'Cashier', shift: 'All Day', phone: '', pin: '' };

// Generate a random 4-digit PIN
const genPin = () => String(Math.floor(1000 + Math.random() * 9000));

export default function StaffManagement() {
  const { store } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Edit form
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  // PIN reveal dialog after creation
  const [pinConfirm, setPinConfirm] = useState<{ name: string; pin: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  const refresh = () => getStaff(store?.id).then(setStaff).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add staff ──────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Staff name is required'); return; }
    // Auto-generate PIN if not provided
    const finalPin = form.pin.trim() || genPin();
    setSaving(true);
    const r = await createStaff({
      store_id: store?.id ?? '',
      name: form.name.trim(),
      role: form.role as Staff['role'],
      shift: form.shift,
      phone: form.phone.trim() || null,
      pin: finalPin,
      active: true,
    });
    setSaving(false);
    if (r) {
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      refresh();
      // Show PIN to owner so they can pass it to the staff member
      setPinConfirm({ name: form.name.trim(), pin: finalPin });
      setPinCopied(false);
    } else {
      toast.error('Failed to add staff member');
    }
  };

  // ── Edit staff ─────────────────────────────────────────────────────────────
  const openEdit = (s: Staff) => {
    setEditTarget(s);
    setEditForm({ name: s.name, role: s.role, shift: s.shift ?? 'All Day', phone: s.phone ?? '', pin: '' });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) { toast.error('Staff name is required'); return; }
    setSaving(true);
    const updates: Partial<Staff> = {
      name: editForm.name.trim(),
      role: editForm.role as Staff['role'],
      shift: editForm.shift,
      phone: editForm.phone.trim() || null,
    };
    // Only update PIN if a new one was entered
    if (editForm.pin.trim()) updates.pin = editForm.pin.trim();

    const r = await updateStaff(editTarget.id, updates);
    setSaving(false);
    if (r) {
      toast.success('Staff updated');
      setShowEdit(false);
      refresh();
      // If PIN was changed, show the new PIN
      if (editForm.pin.trim()) {
        setPinConfirm({ name: editForm.name.trim(), pin: editForm.pin.trim() });
        setPinCopied(false);
      }
    } else {
      toast.error('Failed to update staff');
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const toggleActive = async (s: Staff) => {
    await updateStaff(s.id, { active: !s.active });
    refresh();
    toast.success(s.active ? `${s.name} deactivated` : `${s.name} activated`);
  };

  // ── Copy PIN ───────────────────────────────────────────────────────────────
  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin).catch(() => {});
    setPinCopied(true);
    toast.success('PIN copied to clipboard');
    setTimeout(() => setPinCopied(false), 2500);
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Staff</h1>
          <p className="text-sm text-muted-foreground">
            {staff.filter((s) => s.active).length} active ·{' '}
            {staff.filter((s) => !s.active).length} inactive
          </p>
        </div>
        <Button className="h-9 gap-2 shrink-0" style={{ background: '#166534' }}
          onClick={() => { setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Staff cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No staff added yet</p>
          <p className="text-sm mt-1">Add team members — they receive a PIN to sign into the POS</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((s) => (
            <Card key={s.id} className={`h-full transition-opacity ${s.active ? '' : 'opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ background: s.active ? (ROLE_COLORS[s.role] ?? '#166534') : '#9ca3af' }}
                  >
                    {initials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.phone || 'No phone'}</p>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${s.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-muted text-muted-foreground'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    className="text-[10px]"
                    style={{ background: ROLE_COLORS[s.role] ? ROLE_COLORS[s.role] + '20' : '#dcfce7', color: ROLE_COLORS[s.role] ?? '#166534' }}
                  >
                    {s.role}
                  </Badge>
                  {s.shift && (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                      {s.shift}
                    </Badge>
                  )}
                  {/* Show PIN indicator (masked) */}
                  <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                    <Key className="h-2.5 w-2.5" />
                    PIN set
                  </Badge>
                </div>

                {s.hired_at && (
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Hired: <span className="mono">{s.hired_at.split('T')[0]}</span>
                  </p>
                )}

                <Separator className="mb-3" />
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 h-8 gap-1.5 text-xs"
                    onClick={() => openEdit(s)}>
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 gap-1.5 text-xs"
                    onClick={() => toggleActive(s)}>
                    {s.active
                      ? <><PowerOff className="h-3 w-3 text-destructive" /><span className="text-destructive">Deactivate</span></>
                      : <><Power className="h-3 w-3 text-green-600" /><span className="text-green-600">Activate</span></>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add Staff dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-balance">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Full name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 px-3"
                placeholder="e.g. Jonas Shikongo"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Shift</Label>
                <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 px-3"
                placeholder="0811234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal flex items-center justify-between">
                <span>Login PIN</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pin: genPin() })}
                  className="text-[11px] text-primary font-medium hover:underline"
                >
                  Auto-generate
                </button>
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                className="h-10 px-3 mono tracking-widest"
                placeholder="4–8 digits (auto-generated if empty)"
              />
              <p className="text-[11px] text-muted-foreground">
                This PIN is shown to you once after saving — share it with the staff member to log into POS.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add & Show PIN'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Staff dialog ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-balance">Edit Staff — {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Full name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-10 px-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Shift</Label>
                <Select value={editForm.shift} onValueChange={(v) => setEditForm({ ...editForm, shift: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-10 px-3" placeholder="0811234567" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">New PIN (leave blank to keep current)</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={editForm.pin}
                  onChange={(e) => setEditForm({ ...editForm, pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  className="h-10 px-3 mono tracking-widest flex-1"
                  placeholder="Leave blank to keep"
                />
                <Button variant="outline" className="h-10 px-3 shrink-0 text-xs"
                  onClick={() => setEditForm({ ...editForm, pin: genPin() })}>
                  Generate
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button className="flex-1 h-10" style={{ background: '#166534' }} onClick={handleEdit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PIN Confirmation dialog (shown after add / PIN change) ── */}
      <Dialog open={!!pinConfirm} onOpenChange={(o) => { if (!o) setPinConfirm(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-balance flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Staff Added Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground text-pretty">
              <strong className="text-foreground">{pinConfirm?.name}</strong> has been added to your store.
              Share the PIN below with them — they will need it to sign into the POS.
            </p>

            {/* Big PIN display */}
            <div className="rounded-2xl bg-gradient-to-br from-[#052e16] to-[#166534] p-6 text-center space-y-2">
              <p className="text-green-300 text-xs font-semibold uppercase tracking-widest">Login PIN for</p>
              <p className="text-white font-bold text-lg">{pinConfirm?.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-5xl font-extrabold text-white mono tracking-[0.2em] select-all">
                  {pinConfirm?.pin}
                </span>
              </div>
              <p className="text-green-300/70 text-[11px] mt-1">Tap to select &amp; copy</p>
            </div>

            <Button
              className="w-full h-11 gap-2"
              style={{ background: '#166534' }}
              onClick={() => copyPin(pinConfirm?.pin ?? '')}
            >
              {pinCopied
                ? <><CheckCircle2 className="h-4 w-4" /> Copied!</>
                : <><Copy className="h-4 w-4" /> Copy PIN</>
              }
            </Button>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 text-pretty">
                <strong>Keep this safe.</strong> This PIN is only shown once here.
                You can reset it anytime from the Edit Staff screen.
              </p>
            </div>

            <Button variant="outline" className="w-full h-10"
              onClick={() => setPinConfirm(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
