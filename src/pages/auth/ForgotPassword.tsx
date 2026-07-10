import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, ArrowLeft, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { supabase } from '@/db/supabase';

export default function ForgotPassword() {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }

    setLoading(true);
    try {
      // Look up the email associated with this phone number
      const { data: email, error: lookupErr } = await supabase
        .rpc('get_email_by_phone_for_login', { p_phone: phone.trim() });

      if (lookupErr || !email) {
        toast.error('No account found with this phone number');
        setLoading(false);
        return;
      }

      // Trigger Supabase password reset email
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email as string, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetErr) throw resetErr;

      // Mask the email for display
      const parts = (email as string).split('@');
      const masked = parts[0].slice(0, 2) + '***@' + parts[1];
      setMaskedEmail(masked);
      setSent(true);
    } catch (err) {
      toast.error('Failed to send reset link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} withText={false} />
          <div className="mt-3 text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">AtuStoka</h1>
            <p className="text-green-300 text-xs font-medium tracking-widest uppercase mt-0.5">Password Recovery</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm max-w-[calc(100%-0rem)] md:max-w-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-balance">Forgot Password</CardTitle>
            </div>
            <CardDescription className="text-pretty">
              Enter your registered phone number and we&apos;ll send a reset link to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              /* ── Success state ── */
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Reset link sent!</p>
                    <p className="text-sm text-muted-foreground mt-1 text-pretty">
                      We sent a password reset link to{' '}
                      <span className="font-mono font-semibold text-foreground">{maskedEmail}</span>.
                      Check your inbox and follow the link to create a new password.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800 text-pretty">
                    Didn&apos;t receive the email? Check your spam folder or try again with a different number.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => { setSent(false); setPhone(''); }}
                >
                  Try a different number
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-normal">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 0811234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      className="h-11 pl-9 pr-3"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the phone number you registered with.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  style={{ background: '#166534' }}
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending reset link…</>
                    : 'Send Reset Link'}
                </Button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
