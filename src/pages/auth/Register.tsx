import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { BUSINESS_TYPES, REGIONS } from '@/lib/constants';

interface Step1Data {
  businessName: string;
  businessType: string;
  region: string;
  town: string;
}

interface Step2Data {
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({
    businessName: '',
    businessType: '',
    region: '',
    town: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleNext = () => {
    if (!step1.businessName.trim()) { toast.error('Business name is required'); return; }
    if (!step1.businessType) { toast.error('Please select a business type'); return; }
    if (!step1.region) { toast.error('Please select a region'); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2.ownerName.trim()) { toast.error('Owner name is required'); return; }
    if (!step2.phone.trim()) { toast.error('Phone number is required'); return; }
    if (step2.email.trim() && step2.email.trim().toLowerCase().endsWith('@atustoka.com')) {
      toast.error('The @atustoka.com domain is reserved for platform administrators');
      return;
    }
    if (!step2.email.trim()) { toast.error('Email address is required'); return; }
    if (step2.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (step2.password !== step2.confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const { error } = await signUp(step2.email.trim(), step2.password, {
      businessName: step1.businessName.trim(),
      businessType: step1.businessType,
      region: step1.region,
      town: step1.town.trim(),
      phone: step2.phone.trim(),
      ownerName: step2.ownerName.trim(),
      full_name: step2.ownerName.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      return;
    }
    toast.success('Account created! Welcome to AtuStoka POS.');
    navigate('/', { replace: true });
  };

  const strengthColor = (pw: string) => {
    if (pw.length === 0) return '';
    if (pw.length < 6) return 'bg-destructive';
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'bg-amber-500';
    return 'bg-primary';
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
            <p className="text-green-300 text-xs font-medium tracking-widest uppercase mt-0.5">Point of Sale</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm max-w-[calc(100%-0rem)] md:max-w-md">
          <CardHeader className="pb-3">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-3">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span className={`text-xs font-medium ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Business</span>
              </div>
              <div className={`flex-1 h-0.5 rounded ${step === 2 ? 'bg-primary' : 'bg-border'}`} />
              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className={`text-xs font-medium ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Owner</span>
              </div>
            </div>

            <CardTitle className="text-xl font-bold text-balance">
              {step === 1 ? 'Business Information' : 'Owner Details'}
            </CardTitle>
            <CardDescription className="text-pretty">
              {step === 1 ? 'Tell us about your business to get started' : 'Create your login credentials'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName" className="text-sm font-normal">Business name <span className="text-destructive">*</span></Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Katutura Corner Store"
                    value={step1.businessName}
                    onChange={(e) => setStep1({ ...step1, businessName: e.target.value })}
                    className="h-11 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Business type <span className="text-destructive">*</span></Label>
                  <Select value={step1.businessType} onValueChange={(v) => setStep1({ ...step1, businessType: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Region <span className="text-destructive">*</span></Label>
                  <Select value={step1.region} onValueChange={(v) => setStep1({ ...step1, region: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select region…" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="town" className="text-sm font-normal">Town / City</Label>
                  <Input
                    id="town"
                    placeholder="e.g. Windhoek"
                    value={step1.town}
                    onChange={(e) => setStep1({ ...step1, town: e.target.value })}
                    className="h-11 px-3"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full h-11 font-semibold"
                  style={{ background: '#166534' }}
                  onClick={handleNext}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-sm font-normal">Full name <span className="text-destructive">*</span></Label>
                  <Input
                    id="ownerName"
                    placeholder="e.g. Piet Nakamura"
                    value={step2.ownerName}
                    onChange={(e) => setStep2({ ...step2, ownerName: e.target.value })}
                    className="h-11 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-normal">
                    Phone number <span className="text-destructive">*</span>
                    <span className="ml-1 text-[10px] text-muted-foreground font-normal">(used to sign in)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 0811234567"
                    value={step2.phone}
                    onChange={(e) => setStep2({ ...step2, phone: e.target.value })}
                    className="h-11 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-normal">
                    Email address <span className="text-destructive">*</span>
                    <span className="ml-1 text-[10px] text-muted-foreground font-normal">(for password recovery)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@mystore.com"
                    value={step2.email}
                    onChange={(e) => setStep2({ ...step2, email: e.target.value })}
                    className="h-11 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-normal">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={step2.password}
                      onChange={(e) => setStep2({ ...step2, password: e.target.value })}
                      className="h-11 px-3 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {step2.password && (
                    <div className="h-1 rounded-full bg-muted overflow-hidden mt-1">
                      <div className={`h-full rounded-full transition-all ${strengthColor(step2.password)}`}
                        style={{ width: `${Math.min(100, (step2.password.length / 12) * 100)}%` }} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-normal">Confirm password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={step2.confirmPassword}
                      onChange={(e) => setStep2({ ...step2, confirmPassword: e.target.value })}
                      className="h-11 px-3 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 font-semibold"
                    style={{ background: '#166534' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                    ) : 'Create Account'}
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>

            <p className="mt-3 text-center text-[11px] text-muted-foreground leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
