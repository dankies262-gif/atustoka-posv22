import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Store, Package, ShoppingCart,
  BarChart3, UserPlus, CheckCircle2, Play, ArrowRight,
  Smartphone, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── step data ────────────────────────────────────────────────────────────────
interface Step {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: React.ReactNode;
  color: string;
  accent: string;
  tips: string[];
}

const STEPS: Step[] = [
  {
    id: 1,
    emoji: '🏪',
    title: 'Register Your Business',
    subtitle: 'Takes less than 2 minutes',
    description:
      'Any Namibian business can join — tuck shops, bars, bottle stores, supermarkets, salons, and more. Just provide your business name, type, and region.',
    color: 'from-green-600 to-emerald-700',
    accent: 'bg-green-100 text-green-800',
    tips: [
      'Use your real business name — customers will see it',
      'Choose the right business type for accurate reports',
      'You can add multiple stores under one account',
    ],
    illustration: <RegisterIllustration />,
  },
  {
    id: 2,
    emoji: '📦',
    title: 'Add Your Products',
    subtitle: 'Stock up your inventory',
    description:
      'Add every product you sell — soft drinks, beers, snacks, bread, airtime, and more. Set the selling price, cost price, and stock quantity.',
    color: 'from-teal-600 to-cyan-700',
    accent: 'bg-teal-100 text-teal-800',
    tips: [
      'Add a barcode if you have a scanner',
      'Set stock alerts so you never run out',
      'Group products by category for easy searching',
    ],
    illustration: <InventoryIllustration />,
  },
  {
    id: 3,
    emoji: '🛒',
    title: 'Start Making Sales',
    subtitle: 'Fast checkout at the counter',
    description:
      'Tap items or scan barcodes to add them to the cart. Accept cash, apply discounts, and print or share receipts — all from your phone or tablet.',
    color: 'from-amber-500 to-orange-600',
    accent: 'bg-amber-100 text-amber-800',
    tips: [
      'Staff can log in with a PIN — no password needed',
      'Record exact cash amount for change calculation',
      'Hold a sale and come back to it later',
    ],
    illustration: <POSIllustration />,
  },
  {
    id: 4,
    emoji: '📊',
    title: 'Track Your Reports',
    subtitle: 'Know your numbers daily',
    description:
      'See daily sales totals, best-selling products, profit margins, and expense summaries. Know exactly what is making you money.',
    color: 'from-purple-600 to-violet-700',
    accent: 'bg-purple-100 text-purple-800',
    tips: [
      'Check reports every morning before opening',
      'Export data to share with your accountant',
      'Compare weeks and months to see growth',
    ],
    illustration: <ReportsIllustration />,
  },
  {
    id: 5,
    emoji: '👥',
    title: 'Add Your Staff',
    subtitle: 'Give each cashier a secure PIN',
    description:
      'Add cashiers and staff members. Each person gets a unique PIN to log in to the POS. You can see who processed which sale.',
    color: 'from-rose-500 to-pink-600',
    accent: 'bg-rose-100 text-rose-800',
    tips: [
      'Change PINs anytime if staff leaves',
      'Owner account stays separate from staff',
      'Each sale is tagged to the cashier who made it',
    ],
    illustration: <StaffIllustration />,
  },
];

// ── Illustrations (cartoon SVG style) ────────────────────────────────────────

function RegisterIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Phone */}
      <div className="relative w-44 h-80 rounded-3xl bg-gray-900 shadow-2xl border-4 border-gray-800 flex flex-col overflow-hidden">
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-gray-600" />
        </div>
        <div className="flex-1 bg-white p-3 overflow-hidden space-y-2">
          {/* App header */}
          <div className="h-6 bg-green-600 rounded-lg flex items-center px-2 gap-1">
            <div className="h-3 w-3 rounded-full bg-white/60" />
            <div className="h-2 w-14 bg-white/60 rounded" />
          </div>
          <p className="text-[8px] font-bold text-gray-700">Register Your Store</p>
          {/* Form fields */}
          {['Business Name', 'Business Type', 'Region', 'Phone'].map((f, i) => (
            <div key={i}>
              <div className="h-1.5 w-12 bg-gray-300 rounded mb-0.5" />
              <div className="h-5 bg-gray-100 border border-gray-200 rounded flex items-center px-1.5">
                <div className={`h-1.5 rounded ${i === 0 ? 'w-16 bg-green-400' : i === 3 ? 'w-10 bg-green-300' : 'w-8 bg-gray-300'}`} />
              </div>
            </div>
          ))}
          <div className="h-7 bg-green-600 rounded-lg flex items-center justify-center mt-1">
            <div className="h-2 w-16 bg-white/80 rounded" />
          </div>
        </div>
      </div>
      {/* Floating business cards */}
      {[
        { label: 'Tuck Shop', color: 'bg-green-500', top: 'top-4', left: '-left-2' },
        { label: 'Bar',       color: 'bg-amber-500', top: 'top-16', left: 'left-2' },
        { label: 'Retail',    color: 'bg-teal-500',  top: 'top-28', left: '-left-4' },
      ].map(c => (
        <div key={c.label}
          className={`absolute ${c.top} ${c.left} ${c.color} text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg animate-pulse`}
          style={{ animationDelay: `${Math.random() * 1000}ms` }}>
          {c.label}
        </div>
      ))}
      {/* Success checkmark */}
      <div className="absolute bottom-6 right-2 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
        <CheckCircle2 className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

function InventoryIllustration() {
  const items = [
    { name: 'Coca-Cola 500ml', qty: 24, color: 'bg-red-400' },
    { name: 'Tafel Lager',     qty: 12, color: 'bg-amber-400' },
    { name: 'White Bread',     qty: 8,  color: 'bg-yellow-300' },
    { name: 'Simba Chips',     qty: 30, color: 'bg-orange-400' },
    { name: 'Airtime N$10',    qty: 50, color: 'bg-blue-400' },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div className="w-full max-w-[200px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-teal-600 px-3 py-2 flex items-center gap-2">
          <Package className="h-4 w-4 text-white" />
          <span className="text-white text-xs font-bold">Inventory</span>
          <div className="ml-auto bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{items.length} items</div>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <div className={`h-5 w-5 rounded ${item.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-gray-800 truncate">{item.name}</p>
                <div className="h-1 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${Math.min(100, (item.qty / 50) * 100)}%` }} />
                </div>
              </div>
              <span className="text-[9px] text-gray-500 shrink-0">{item.qty}</span>
            </div>
          ))}
        </div>
        <div className="px-3 py-2">
          <div className="h-6 bg-teal-600 rounded-lg flex items-center justify-center gap-1">
            <div className="h-1.5 w-1.5 bg-white rounded-full" />
            <div className="h-1.5 w-12 bg-white/80 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function POSIllustration() {
  const items = ['Coke', 'Bread', 'Beer ×2'];
  return (
    <div className="w-full h-full flex items-center justify-center gap-3 px-2">
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {['🥤', '🍺', '🍞', '🍟', '🍭', '📱'].map((e, i) => (
          <div key={i}
            className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center border-2 text-xl shadow-sm cursor-pointer transition-transform ${i < 3 ? 'border-amber-400 bg-amber-50 scale-95' : 'border-gray-200 bg-white'}`}>
            <span className="text-base">{e}</span>
          </div>
        ))}
      </div>
      {/* Cart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-28 overflow-hidden">
        <div className="bg-amber-500 px-2 py-1.5 flex items-center gap-1">
          <ShoppingCart className="h-3 w-3 text-white" />
          <span className="text-white text-[10px] font-bold">Cart</span>
        </div>
        <div className="p-1.5 space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-1 py-0.5 rounded bg-gray-50">
              <span className="text-[9px] text-gray-700">{item}</span>
              <div className="h-1.5 w-6 bg-amber-300 rounded" />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-2 py-1 flex justify-between">
          <span className="text-[9px] font-bold text-gray-700">Total</span>
          <span className="text-[9px] font-extrabold text-amber-600">N$45</span>
        </div>
        <div className="px-1.5 pb-2">
          <div className="h-5 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">CHARGE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsIllustration() {
  const bars = [40, 65, 50, 80, 55, 90, 70];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div className="w-full max-w-[200px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-purple-600 px-3 py-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-white" />
          <span className="text-white text-xs font-bold">Weekly Sales</span>
        </div>
        <div className="p-3">
          {/* Stat pills */}
          <div className="flex gap-1.5 mb-3">
            <div className="flex-1 bg-purple-50 rounded-lg p-1.5 text-center">
              <p className="text-[10px] font-extrabold text-purple-700">N$3,240</p>
              <p className="text-[8px] text-gray-500">This week</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg p-1.5 text-center">
              <p className="text-[10px] font-extrabold text-green-700">+18%</p>
              <p className="text-[8px] text-gray-500">vs last wk</p>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1 h-16">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full rounded-t-sm transition-all ${i === 5 ? 'bg-purple-600' : 'bg-purple-200'}`}
                  style={{ height: `${h}%` }} />
                <span className="text-[7px] text-gray-400">{days[i]}</span>
              </div>
            ))}
          </div>
          {/* Top product */}
          <div className="mt-2 bg-gray-50 rounded-lg px-2 py-1.5 flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-purple-100 flex items-center justify-center text-[10px]">🏆</div>
            <div>
              <p className="text-[8px] font-semibold text-gray-700">Top seller: Coke 500ml</p>
              <p className="text-[8px] text-gray-400">142 units · N$710</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffIllustration() {
  const staff = [
    { name: 'Maria N.',  pin: '••••', color: 'bg-rose-400', role: 'Cashier' },
    { name: 'Jonas S.',  pin: '••••', color: 'bg-blue-400',  role: 'Cashier' },
    { name: 'Anna K.',   pin: '••••', color: 'bg-green-400', role: 'Supervisor' },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div className="w-full max-w-[200px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-rose-500 px-3 py-2 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-white" />
          <span className="text-white text-xs font-bold">Staff Members</span>
        </div>
        <div className="divide-y divide-gray-50">
          {staff.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <div className={`h-8 w-8 rounded-full ${s.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-800">{s.name}</p>
                <p className="text-[8px] text-gray-400">{s.role}</p>
              </div>
              <div className="shrink-0 bg-gray-100 rounded-lg px-2 py-0.5">
                <span className="text-[10px] font-mono text-gray-500">PIN: {s.pin}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2">
          <div className="h-6 bg-rose-500 rounded-lg flex items-center justify-center gap-1">
            <div className="h-1.5 w-1.5 bg-white rounded-full" />
            <div className="h-1.5 w-14 bg-white/80 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function HowItWorks() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground text-balance">How AtuStoka Works</h1>
            <p className="text-xs text-muted-foreground">Step-by-step guide for Namibian businesses</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/register')} className="gap-1.5 h-8">
          Get Started <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-4 md:px-8 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {current + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-semibold text-primary">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex flex-col items-center gap-0.5 group`}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  i < current ? 'bg-primary border-primary' :
                  i === current ? 'border-primary bg-primary/10 scale-110' :
                  'border-gray-300 bg-white'
                }`}>
                  {i < current
                    ? <CheckCircle2 className="h-3 w-3 text-white" />
                    : <span className="text-[9px] font-bold text-gray-500">{i + 1}</span>}
                </div>
                <span className="hidden md:block text-[9px] text-muted-foreground text-center w-14 truncate">
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main card ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-border">
            <div className={`bg-gradient-to-r ${step.color} px-6 md:px-10 py-6 md:py-8`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Step info */}
                <div className="flex-1 min-w-0 text-white space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20`}>
                      Step {step.id} of {STEPS.length}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-balance flex items-center gap-2">
                    <span>{step.emoji}</span> {step.title}
                  </h2>
                  <p className="text-white/80 text-sm font-medium">{step.subtitle}</p>
                </div>
                {/* Device icons */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white/20 rounded-xl p-2">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Illustration */}
              <div className="h-64 md:h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b md:border-b-0 md:border-r border-border">
                {step.illustration}
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    {step.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      💡 Pro Tips
                    </p>
                    {step.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground text-pretty">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step indicators small */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div key={i} onClick={() => setCurrent(i)}
                      className={`h-1.5 rounded-full cursor-pointer transition-all ${
                        i === current ? 'w-6 bg-primary' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                      }`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation footer */}
            <div className="border-t border-border px-6 md:px-8 py-4 flex items-center justify-between gap-4 bg-gray-50/60">
              <Button variant="outline" className="gap-2 h-9"
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>

              <div className="flex-1 flex justify-center">
                {current === STEPS.length - 1 ? (
                  <Button className="gap-2 h-9 px-6" onClick={() => navigate('/register')}>
                    Register Your Business <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              {current < STEPS.length - 1 ? (
                <Button className="gap-2 h-9" onClick={() => setCurrent(c => c + 1)}>
                  Next Step <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="gap-2 h-9" onClick={() => navigate('/register')}>
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Bottom CTA row */}
          <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Ready to run your business smarter?
            </p>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              style={{ background: '#166534' }} onClick={() => navigate('/register')}>
              <Store className="h-3.5 w-3.5" /> Start Free Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
