import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, BarChart2, Users, Package, Smartphone, Shield,
  CheckCircle2, Share2, Copy, Star, Zap, Globe, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

const FEATURES = [
  { icon: <ShoppingCart className="h-5 w-5" />, title: 'Fast POS', desc: 'Process sales in seconds with barcode scanning, multiple payment methods, and instant receipts.' },
  { icon: <Package className="h-5 w-5" />, title: 'Inventory Control', desc: 'Track stock levels, get low-stock alerts, and manage products with ease.' },
  { icon: <BarChart2 className="h-5 w-5" />, title: 'Business Reports', desc: 'Understand your sales, expenses, and profits with clear visual charts and reports.' },
  { icon: <Users className="h-5 w-5" />, title: 'Customer Management', desc: 'Build loyalty with customer profiles, store credit, and purchase history.' },
  { icon: <Smartphone className="h-5 w-5" />, title: 'Mobile Friendly', desc: 'Works perfectly on any phone, tablet or computer — no app download needed.' },
  { icon: <Shield className="h-5 w-5" />, title: 'Secure & Reliable', desc: 'Your data is backed up and protected automatically in the cloud.' },
];

const TESTIMONIALS = [
  { name: 'Maria N.', business: 'Katutura Corner Store', text: "AtuStoka changed how I run my shop. I can see exactly what is selling and what is not.", stars: 5 },
  { name: 'Joseph K.', business: 'Oshakati Bottle Store', text: "The stock alerts save me from running out of top products. Very easy to use even for my staff.", stars: 5 },
  { name: 'Selma P.', business: 'Windhoek Hair Salon', text: "I finally know my real profits after expenses. The reports are clear and simple.", stars: 5 },
];

const PLAN_FEATURES = [
  'Unlimited products & sales',
  'Barcode scanner support',
  'Multiple payment methods (Cash, MTC MoMo, FNB eWallet, NamPost)',
  'Customer loyalty & store credit',
  'Staff management with PIN login',
  'Expense tracking',
  'Business reports & charts',
  'Multi-store support',
  'Admin panel for platform oversight',
  'Works offline (coming soon)',
];

export default function Advertise() {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      toast.success('Link copied! Share it with your network.');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'AtuStoka POS — Free POS for Namibian Businesses',
        text: 'Manage your shop with AtuStoka — free point-of-sale, inventory, and business reports built for Namibia.',
        url: appUrl,
      }).catch(() => null);
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] text-white">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <div className="flex justify-center mb-6">
            <Logo size={72} withText={false} />
          </div>

          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-xs">
            🇳🇦 Built for Namibian Businesses
          </Badge>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance">
            Run Your Shop Smarter with <span className="text-green-300">AtuStoka</span>
          </h1>

          <p className="text-green-100 text-base md:text-lg max-w-2xl mx-auto mb-8 text-pretty">
            The free point-of-sale and business management app designed for Namibian retailers,
            bottle stores, hair salons, and more. No monthly fees. No complicated setup.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-[#166534] hover:bg-green-50 w-full sm:w-auto">
                Start for Free →
              </Button>
            </Link>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 px-8 text-base border border-white/40 text-white hover:bg-white/10 w-full sm:w-auto gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share AtuStoka
            </Button>
          </div>

          <p className="mt-4 text-green-200/60 text-xs">No credit card required · Works on any device</p>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: <Zap className="h-4 w-4 mx-auto mb-1 opacity-80" />, val: '2 min', label: 'Setup time' },
            { icon: <Globe className="h-4 w-4 mx-auto mb-1 opacity-80" />, val: 'Free', label: 'No hidden fees' },
            { icon: <TrendingUp className="h-4 w-4 mx-auto mb-1 opacity-80" />, val: '100%', label: 'Cloud backed' },
          ].map((s) => (
            <div key={s.label}>
              {s.icon}
              <p className="text-xl md:text-2xl font-extrabold leading-tight">{s.val}</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-balance mb-2">
          Everything you need to run your business
        </h2>
        <p className="text-muted-foreground text-center text-pretty mb-10 max-w-xl mx-auto">
          AtuStoka combines POS, stock management, and reporting in one simple app.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full">
              <CardContent className="p-5 flex gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 text-pretty leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── What's included ── */}
      <div className="max-w-4xl mx-auto px-4 py-14">
        <div className="rounded-2xl bg-[#052e16] text-white p-8 md:p-12">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-xs">100% Free</Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-balance">Everything included, free forever</h2>
          <p className="text-green-200 text-sm mb-8 text-pretty">
            No trial. No premium tier. Everything listed below is included at no cost.
          </p>

          <div className="grid md:grid-cols-2 gap-2 mb-8">
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm text-green-100">{f}</span>
              </div>
            ))}
          </div>

          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-[#166534] hover:bg-green-50 w-full sm:w-auto">
              Create Your Free Account →
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* ── Testimonials ── */}
      <div className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center text-balance mb-8">
          Trusted by Namibian business owners
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="h-full">
              <CardContent className="p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground text-pretty leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.business}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Share CTA ── */}
      <div className="max-w-4xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">
          Know a business that needs AtuStoka?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-pretty">
          Share this link with fellow business owners in Namibia and help them manage their shops smarter.
        </p>

        {/* Shareable URL box */}
        <div className="flex items-center gap-2 max-w-sm mx-auto mb-6">
          <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2.5 border border-border">
            <p className="text-xs font-mono text-muted-foreground truncate">{appUrl}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <Button
          size="lg"
          className="h-12 px-8 text-base font-semibold gap-2"
          style={{ background: '#166534' }}
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
          Share via WhatsApp / SMS
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={20} withText={false} />
            <span className="font-semibold text-foreground">AtuStoka POS</span>
            <span>· Free Point of Sale for Namibia</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-foreground">Sign In</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
