import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

function PinInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="password"
      inputMode="numeric"
      maxLength={5}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
      placeholder={placeholder ?? '• • • • •'}
      autoComplete="off"
      className="h-12 px-3 font-mono tracking-[0.8em] text-center text-xl"
    />
  );
}

export default function AdminSetupPin() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [pin, setPin]               = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('You must be logged in'); return; }
    if (pin.length !== 5)       { toast.error('PIN must be exactly 5 digits'); return; }
    if (pin !== confirmPin)     { toast.error('PINs do not match'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('set_admin_pin', { p_pin: pin });
      if (error) throw error;
      toast.success('PIN set! Welcome to the Admin Dashboard.');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error((err as Error).message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} withText={false} />
          <div className="mt-3 text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AtuStoka</h1>
            <p className="text-indigo-300 text-sm font-medium tracking-widest uppercase mt-0.5">Admin Setup</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-2">
              <Lock className="h-5 w-5 text-indigo-600" />
            </div>
            <CardTitle className="text-xl font-bold text-balance">Set Your Admin PIN</CardTitle>
            <CardDescription className="text-pretty">
              Your account requires a 5-digit PIN before you can access the admin dashboard. This PIN confirms sensitive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">
                  5-digit PIN <span className="text-destructive">*</span>
                </Label>
                <PinInput value={pin} onChange={setPin} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">
                  Confirm PIN <span className="text-destructive">*</span>
                </Label>
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 text-pretty">
                  This PIN will be required to deactivate user accounts. Keep it safe — you can change it later from the admin header.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  'Set PIN & Enter Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
