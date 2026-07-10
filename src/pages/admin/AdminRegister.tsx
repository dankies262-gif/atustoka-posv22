import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck, Eye, EyeOff, Loader2, Copy, CheckCircle2,
  Camera, X, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { supabase } from '@/db/supabase';

// ── Indigo background ─────────────────────────────────────────────────────────
function IndigoBg({ children }: { children: React.ReactNode }) {
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
      <div className="relative w-full flex flex-col items-center">{children}</div>
    </div>
  );
}

// ── PIN reveal card ───────────────────────────────────────────────────────────
function PinRevealCard({ pin, onContinue }: { pin: string; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm w-full max-w-md">
      <CardContent className="p-8 flex flex-col items-center text-center gap-5">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-indigo-900 text-balance">Account Created!</h2>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            Your administrator account is ready. Below is your <strong>auto-generated 5-digit PIN</strong>.
            This is shown <span className="text-red-600 font-semibold">only once</span> — save it now.
          </p>
        </div>

        {/* PIN display */}
        <div className="w-full rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Your Admin PIN</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-extrabold text-indigo-800 font-mono tracking-[0.3em]">{pin}</span>
            <button
              onClick={handleCopy}
              className="ml-2 h-8 w-8 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors shrink-0"
              title="Copy PIN"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-indigo-600" />}
            </button>
          </div>
        </div>

        <div className="w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
          <p className="text-xs text-amber-800 text-pretty">
            <strong>Keep this PIN secret.</strong> You will need it to confirm sensitive actions like deactivating user accounts. Store it in a secure place. You cannot recover this PIN — only change it if you know the current one.
          </p>
        </div>

        <Button
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          onClick={onContinue}
        >
          I've saved my PIN — Enter Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Avatar picker ─────────────────────────────────────────────────────────────
function AvatarPicker({
  preview, onFileChange, onRemove,
}: {
  preview: string | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-normal">
        Profile photo <span className="text-destructive">*</span>
      </Label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-200 shrink-0">
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="h-16 w-16 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors shrink-0"
          >
            <Camera className="h-6 w-6 text-indigo-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={() => inputRef.current?.click()}
          >
            {preview ? 'Change photo' : 'Upload photo'}
          </Button>
          <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG or WEBP · max 2MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
            onFileChange(file);
          }}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminRegister() {
  const navigate = useNavigate();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim())   { toast.error('Full name is required'); return; }
    if (!email.trim())      { toast.error('Email address is required'); return; }
    const emailLc = email.trim().toLowerCase();
    const isGmail = emailLc.endsWith('@gmail.com');
    const isAtustoka = emailLc.endsWith('@atustoka.com');
    if (!isGmail && !isAtustoka) {
      toast.error('Only Gmail or @atustoka.com email addresses are accepted');
      return;
    }
    if (!avatarFile)        { toast.error('Profile photo is required'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPw) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      // 1. Sign up in Supabase Auth first so we have a session to upload the avatar
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailLc,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signUpErr) throw signUpErr;
      const uid = signUpData.user?.id;
      if (!uid) throw new Error('Registration failed — please try again');

      // 2. Upload avatar to storage
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const filePath = `${uid}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadErr) throw new Error(`Avatar upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from('admin-avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;

      // 3. Call edge function to create the admin profile + auto-generate PIN
      //    (edge function uses service role; it accepts the newly-created user's own session)
      const { data: result, error: fnErr } = await supabase.functions.invoke('admin-create-account', {
        body: {
          type: 'admin',
          full_name: fullName.trim(),
          email: emailLc,
          password, // edge function will upsert profile only (user already exists)
          avatar_url: avatarUrl,
        },
      });
      if (fnErr) {
        const msg = await fnErr?.context?.text?.();
        throw new Error(msg || fnErr.message);
      }

      const pin: string = result?.generated_pin;
      if (!pin) throw new Error('PIN generation failed — contact support');

      setGeneratedPin(pin);
    } catch (err) {
      toast.error(String(err).replace('Error: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handlePinContinue = () => {
    navigate('/admin', { replace: true });
  };

  return (
    <IndigoBg>
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} withText={false} />
          <div className="mt-3 text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AtuStoka</h1>
            <p className="text-indigo-300 text-sm font-medium tracking-widest uppercase mt-0.5">
              Admin Registration
            </p>
          </div>
        </div>

        {/* ── PIN reveal step ── */}
        {generatedPin ? (
          <PinRevealCard pin={generatedPin} onContinue={handlePinContinue} />
        ) : (
          /* ── Registration form ── */
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-bold text-balance">Create Administrator Account</CardTitle>
              <CardDescription className="text-pretty">
                Only <span className="font-mono font-semibold">@gmail.com</span> or{' '}
                <span className="font-mono font-semibold">@atustoka.com</span> addresses accepted.
                A unique 5-digit PIN will be generated for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar */}
                <AvatarPicker
                  preview={avatarPreview}
                  onFileChange={handleFileChange}
                  onRemove={handleRemoveAvatar}
                />

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Full name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Reinhold Shilongo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 px-3"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Email address <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="name@gmail.com or name@atustoka.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 px-3 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Confirm password <span className="text-destructive">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="h-11 px-3"
                  />
                </div>

                <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                  <p className="text-xs text-indigo-700 text-pretty">
                    After registration a <strong>unique 5-digit PIN</strong> will be auto-generated and shown to you once. Use it to confirm sensitive actions like deactivating accounts.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-base bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                  ) : (
                    'Create Account & Get PIN'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </IndigoBg>
  );
}
