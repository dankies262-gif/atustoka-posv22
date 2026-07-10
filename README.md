# AtuStoka POS 🛒

**Comprehensive Point-of-Sale and Business Management System for Namibian Retail Businesses**

![Status](https://img.shields.io/badge/Status-Core%20Infrastructure%20Complete-success)
![Database](https://img.shields.io/badge/Database-Supabase-green)
![Framework](https://img.shields.io/badge/Framework-React%2018-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

---

## 📖 Overview

AtuStoka POS is a full-featured point-of-sale system designed specifically for Namibian retail businesses including bars, taverns, bottle stores, supermarkets, and general dealers. The system features offline-first operation with cloud sync, barcode scanning, multiple payment methods, and comprehensive business management tools.

### Key Features

- ✅ **Full Database Infrastructure** - Supabase backend with 8 tables and RLS
- ✅ **Barcode Scanning** - Camera-based scanning with Quagga2
- ✅ **9 Payment Methods** - Cash, Card, Mobile Money (MTC MoMo, PayToday, etc.)
- ✅ **Inventory Management** - Stock tracking with low-stock alerts
- ✅ **Customer Management** - Credit tracking and loyalty
- ✅ **Financial Reports** - Revenue, expenses, profit/loss
- ✅ **Staff Management** - Roles, shifts, and permissions
- ✅ **Namibian Dollar (N$)** - All currency in N$

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account (already configured)
- Modern browser with camera support

### Installation

```bash
# Clone the repository
cd /workspace/app-bn2s03zsnx8h

# Install dependencies (already done)
pnpm install

# Environment variables are already set in .env
# VITE_SUPABASE_URL=https://kpfetcqjvyspecxwzisw.supabase.co
# VITE_SUPABASE_ANON_KEY=[configured]

# Run linting
npm run lint
```

### Database Setup

✅ **Already Complete!**
- All tables created
- RLS policies configured
- Indexes added
- Ready to use

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── Logo.tsx                 # ✅ AtuStoka logo
│   └── BarcodeScanner.tsx       # ✅ Camera barcode scanner
│
├── pages/                       # ⏳ TO CREATE
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── Dashboard.tsx
│   ├── POS.tsx
│   ├── Inventory.tsx
│   └── ... (10 pages total)
│
├── contexts/
│   └── AuthContext.tsx          # ✅ Authentication
│
├── services/
│   └── database.ts              # ✅ All CRUD operations
│
├── lib/
│   ├── format.ts                # ✅ Utilities (currency, dates)
│   └── constants.ts             # ✅ All constants
│
├── types/
│   └── database.ts              # ✅ TypeScript types
│
└── db/
    └── supabase.ts              # ✅ Supabase client
```

---

## 🗄️ Database Schema

### Tables

1. **stores** - Business profiles
2. **products** - Inventory with barcode support
3. **customers** - Customer records with credit tracking
4. **sales** - Sales transactions
5. **sale_items** - Line items for each sale
6. **expenses** - Business expenses
7. **staff** - Staff management
8. **stock_movements** - Stock history

### Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Users can only access their own store data
- ✅ Helper functions for permission checks

---

## 💻 Development

### Core Files Created

#### 1. Type Definitions (`src/types/database.ts`)
```typescript
export interface Product {
  id: string;
  store_id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  // ... more fields
}
// + Store, Customer, Sale, Expense, Staff, etc.
```

#### 2. Database Services (`src/services/database.ts`)
```typescript
// Complete CRUD operations
export async function getProducts(): Promise<Product[]>
export async function createProduct(product): Promise<Product | null>
export async function updateProduct(id, updates): Promise<Product | null>
// + 20+ more functions
```

#### 3. Utilities (`src/lib/format.ts`)
```typescript
formatCurrency(100) // "N$100.00"
calculateVAT(100)   // 15.00
calculateTotal(100) // 115.00
getTodayISO()       // "2026-05-14"
```

#### 4. Constants (`src/lib/constants.ts`)
```typescript
PAYMENT_METHODS // 9 payment methods
CATEGORIES      // 12 product categories
REGIONS         // 14 Namibian regions
BUSINESS_TYPES  // 8 business types
// + more
```

#### 5. Components
- **Logo** (`src/components/Logo.tsx`) - Teal branded logo
- **BarcodeScanner** (`src/components/BarcodeScanner.tsx`) - Full camera scanner

#### 6. Authentication (`src/contexts/AuthContext.tsx`)
```typescript
const { user, store, signIn, signUp, signOut } = useAuth();
```

---

## 🎨 Design System

### Colors (Teal Theme)
- **Primary**: `#0D9488` (Teal-600)
- **Success**: `#10B981` (Green-500)
- **Danger**: `#EF4444` (Red-500)
- **Warning**: `#F59E0B` (Amber-500)

### Typography
- **Headings**: Bold, text-xl/2xl/3xl
- **Body**: text-sm/base
- **Numbers**: Use `.mono` class

### Components
- Use shadcn/ui components throughout
- Consistent spacing with Tailwind scale
- Responsive design (mobile-first)

---

## 📋 Implementation Checklist

### ✅ Completed (40%)
- [x] Database schema and RLS
- [x] TypeScript type system
- [x] Database service functions
- [x] Utility functions
- [x] Constants and configuration
- [x] Authentication context
- [x] Logo component
- [x] Barcode scanner component
- [x] Styling and theme

### ⏳ To Do (60%)
- [ ] Authentication pages (Login, Register)
- [ ] Layout components (MainLayout, Sidebar, TopBar)
- [ ] Dashboard page
- [ ] POS system page
- [ ] Inventory management page
- [ ] Customer management page
- [ ] Expense tracking page
- [ ] Financial reports page
- [ ] Returns processing page
- [ ] Store credits page
- [ ] Stock history page
- [ ] Staff management page
- [ ] Routing configuration
- [ ] Testing and polish

---

## 🔧 Usage Examples

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, store, signIn, signOut } = useAuth();

  const handleLogin = async () => {
    const { error } = await signIn('user@example.com', 'password');
    if (!error) {
      // Redirect to dashboard
    }
  };
}
```

### Database Operations
```typescript
import { getProducts, createProduct } from '@/services/database';

// Fetch products
const products = await getProducts();

// Create product
const product = await createProduct({
  store_id: store.id,
  name: 'Windhoek Lager 24pk',
  barcode: '6001234000001',
  price: 289.99,
  cost: 210,
  stock: 48,
  threshold: 12,
  category: 'Beer & Cider',
  active: true,
});
```

### Barcode Scanning
```typescript
import { BarcodeScanner } from '@/components/BarcodeScanner';

function POSPage() {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) addToCart(product);
  };

  return (
    <Dialog open={showScanner} onOpenChange={setShowScanner}>
      <DialogContent>
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

### Currency Formatting
```typescript
import { formatCurrency, calculateVAT, calculateTotal } from '@/lib/format';

const subtotal = 100;
const vat = calculateVAT(subtotal);     // 15
const total = calculateTotal(subtotal);  // 115

<div>Total: {formatCurrency(total)}</div> // "N$115.00"
```

---

## 📚 Documentation

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete implementation guide
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Detailed project structure
- **[DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md)** - Development summary
- **[seed_data.sql](./seed_data.sql)** - Sample data for testing
- **[docs/prd.md](./docs/prd.md)** - Product Requirements Document

---

## 🎯 Next Steps

### Immediate Actions (Priority Order)

1. **Create Authentication Pages** (2-3 hours)
   - `src/pages/auth/Login.tsx`
   - `src/pages/auth/Register.tsx`

2. **Create Layout Components** (1-2 hours)
   - `src/components/layouts/MainLayout.tsx`
   - `src/components/layouts/Sidebar.tsx`
   - `src/components/layouts/TopBar.tsx`

3. **Create Core Pages** (4-6 hours)
   - Dashboard
   - POS System
   - Inventory Management

4. **Create Additional Pages** (3-4 hours)
   - Customers, Expenses, Reports
   - Returns, Credits, History, Staff

5. **Configure Routing** (1 hour)
   - Update `src/routes.tsx`
   - Update `src/App.tsx`

6. **Test & Polish** (2-3 hours)
   - Test all features
   - Fix lint issues
   - Mobile testing

**Total Estimated Time**: 12-16 hours

---

## 🧪 Testing

### Test Barcodes
- `6001234000001` - Windhoek Lager 24pk
- `5449000131805` - Coca-Cola 2L
- `4088700100010` - Jagermeister 750ml

### Demo Account (Create via Register)
- Email: `demo@atustoka.na`
- Password: `Demo@1234`
- Business: `Demo Store`
- Type: `Bar / Tavern`
- Region: `Khomas`

### Seed Data
Run `seed_data.sql` after registration to populate with sample:
- 10 products
- 5 customers
- 4 staff members
- 4 expenses

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: User not authenticated
- **Solution**: Ensure AuthProvider wraps the app

**Issue**: No data showing
- **Solution**: Check RLS policies in Supabase dashboard

**Issue**: Barcode scanner not working
- **Solution**: Enable camera permissions, use HTTPS

**Issue**: Type errors
- **Solution**: Import types from `src/types/database.ts`

**Issue**: Layout overlapping
- **Solution**: Use proper flex layout with `min-w-0`

---

## 📞 Support

- **Supabase Dashboard**: https://supabase.com/dashboard/project/kpfetcqjvyspecxwzisw
- **shadcn/ui**: https://ui.shadcn.com
- **Quagga2**: https://github.com/ericblade/quagga2

---

## 📄 License

This project is proprietary software for AtuStoka POS.

---

## 🙏 Acknowledgments

- **Supabase** - Backend and database
- **shadcn/ui** - UI components
- **Quagga2** - Barcode scanning
- **React** - Frontend framework
- **Tailwind CSS** - Styling

---

**Status**: Core infrastructure complete. Ready for page implementation.

**Last Updated**: 2026-05-14

**Version**: 1.0.0-alpha
