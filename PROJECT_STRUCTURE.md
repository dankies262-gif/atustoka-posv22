# AtuStoka POS - Project Structure

## 📁 Complete File Structure

```
/workspace/app-bn2s03zsnx8h/
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (pre-installed)
│   │   ├── layouts/                 # TO CREATE
│   │   │   ├── MainLayout.tsx      # Main app layout with sidebar
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   └── TopBar.tsx          # Mobile top bar
│   │   ├── Logo.tsx                # ✅ CREATED
│   │   └── BarcodeScanner.tsx      # ✅ CREATED
│   │
│   ├── pages/                       # TO CREATE
│   │   ├── auth/
│   │   │   ├── Login.tsx           # Login page
│   │   │   └── Register.tsx        # 2-step registration
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── POS.tsx                 # Point of Sale
│   │   ├── Inventory.tsx           # Product management
│   │   ├── Customers.tsx           # Customer management
│   │   ├── Expenses.tsx            # Expense tracking
│   │   ├── Reports.tsx             # Financial reports
│   │   ├── Returns.tsx             # Return processing
│   │   ├── StoreCredits.tsx        # Credit management
│   │   ├── StockHistory.tsx        # Stock movements
│   │   └── Staff.tsx               # Staff management
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # ✅ UPDATED
│   │
│   ├── services/
│   │   └── database.ts             # ✅ CREATED - All CRUD operations
│   │
│   ├── lib/
│   │   ├── format.ts               # ✅ CREATED - Utilities
│   │   ├── constants.ts            # ✅ CREATED - All constants
│   │   └── utils.ts                # Existing utility functions
│   │
│   ├── types/
│   │   └── database.ts             # ✅ CREATED - All TypeScript types
│   │
│   ├── db/
│   │   └── supabase.ts             # ✅ CREATED - Supabase client
│   │
│   ├── hooks/                       # Existing hooks
│   ├── index.css                    # ✅ UPDATED - Teal theme + animations
│   ├── App.tsx                      # TO UPDATE - Add routing
│   ├── routes.tsx                   # TO UPDATE - Define all routes
│   └── main.tsx                     # Entry point
│
├── supabase/                        # Supabase migrations (auto-generated)
├── public/                          # Static assets
├── docs/
│   └── prd.md                       # Product Requirements Document
├── IMPLEMENTATION_GUIDE.md          # ✅ CREATED - Complete guide
├── seed_data.sql                    # ✅ CREATED - Sample data
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## ✅ Completed Files

### 1. Database & Backend
- **supabase/migrations/** - All database tables, RLS policies, indexes
- **src/db/supabase.ts** - Supabase client configuration
- **src/services/database.ts** - Complete CRUD operations for all entities

### 2. Type Definitions
- **src/types/database.ts** - All TypeScript interfaces:
  - Store, Product, Customer, Sale, SaleItem
  - Expense, Staff, StockMovement
  - CartItem, PaymentMethod

### 3. Utilities & Constants
- **src/lib/format.ts** - Utility functions:
  - `formatCurrency(amount)` - Format as N$
  - `getTodayISO()` - Get today's date
  - `formatDate(date)` - Format for display
  - `calculateVAT(subtotal)` - Calculate 15% VAT
  - `calculateTotal(subtotal)` - Subtotal + VAT
  - `getInitials(name)` - Get user initials

- **src/lib/constants.ts** - All constants:
  - `PAYMENT_METHODS` - 9 payment methods with icons/colors
  - `CATEGORIES` - Product categories
  - `BUSINESS_TYPES` - Business type options
  - `REGIONS` - 14 Namibian regions
  - `ROLES` - Staff roles
  - `SHIFTS` - Work shifts
  - `EXPENSE_CATEGORIES` - Expense types
  - `CUSTOMER_TYPES` - Customer types
  - `ROLE_COLORS` - Color mapping for roles
  - `PAYMENT_INSTRUCTIONS` - Instructions for each payment method

### 4. Components
- **src/components/Logo.tsx** - AtuStoka logo component
- **src/components/BarcodeScanner.tsx** - Camera barcode scanner with Quagga2

### 5. Context
- **src/contexts/AuthContext.tsx** - Authentication context with:
  - `useAuth()` hook
  - `signIn(email, password)`
  - `signUp(email, password, metadata)`
  - `signOut()`
  - `user`, `store`, `loading` state

### 6. Styling
- **src/index.css** - Updated with:
  - Teal primary color theme
  - Scrollbar styling
  - Animation keyframes (pulse, scanAnim)
  - Monospace font class
  - Live dot animation

### 7. Documentation
- **IMPLEMENTATION_GUIDE.md** - Complete implementation guide
- **seed_data.sql** - Sample data for testing

## 📋 Files to Create

### Priority 1: Authentication (Required First)
```
src/pages/auth/Login.tsx
src/pages/auth/Register.tsx
```

### Priority 2: Layout (Required for All Pages)
```
src/components/layouts/MainLayout.tsx
src/components/layouts/Sidebar.tsx
src/components/layouts/TopBar.tsx
```

### Priority 3: Core Pages
```
src/pages/Dashboard.tsx
src/pages/POS.tsx
src/pages/Inventory.tsx
```

### Priority 4: Additional Pages
```
src/pages/Customers.tsx
src/pages/Expenses.tsx
src/pages/Reports.tsx
src/pages/Returns.tsx
src/pages/StoreCredits.tsx
src/pages/StockHistory.tsx
src/pages/Staff.tsx
```

### Priority 5: Routing
```
src/routes.tsx (update)
src/App.tsx (update)
```

## 🔧 Database Schema Summary

### Tables Created:
1. **stores** - Business profiles
   - owner_id, business_name, business_type, region, town, phone

2. **products** - Inventory
   - store_id, name, sku, barcode, price, cost, stock, threshold, category, supplier, active

3. **customers** - Customer records
   - store_id, name, phone, email, type, credit, total_spent, visits

4. **sales** - Sales transactions
   - store_id, customer_id, customer_name, subtotal, vat, total, payment_method, payment_ref, cash_given, change, cashier_name, cashier_id, status, sale_date

5. **sale_items** - Line items
   - sale_id, product_id, product_name, quantity, unit_price, line_total

6. **expenses** - Business expenses
   - store_id, description, amount, category, expense_date, paid_by

7. **staff** - Staff members
   - store_id, name, role, phone, pin, shift, active, hire_date

8. **stock_movements** - Stock history
   - store_id, product_id, product_name, quantity, movement_type, reference_id, reference_type, reason, created_by

### RLS Policies:
- All tables have Row Level Security enabled
- Users can only access their own store's data
- Helper functions: `get_user_store_id()`, `user_owns_store()`

## 🎨 Design Tokens

### Colors
```typescript
Primary: #0D9488 (Teal-600)
Success: #10B981 (Green-500)
Danger: #EF4444 (Red-500)
Warning: #F59E0B (Amber-500)
Info: #3B82F6 (Blue-500)
Muted: #64748B (Slate-500)
```

### Spacing
- Use Tailwind spacing scale: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Typography
- Headings: font-bold, text-xl/2xl/3xl
- Body: text-sm/base
- Monospace: Use `.mono` class for numbers/codes

### Components
- Cards: `bg-card border rounded-lg p-4`
- Buttons: Use shadcn/ui Button component
- Inputs: Use shadcn/ui Input component
- Badges: Use shadcn/ui Badge component

## 🚀 Quick Start Guide

### 1. Install Dependencies (Already Done)
```bash
pnpm install
```

### 2. Environment Variables (Already Set)
```
VITE_SUPABASE_URL=https://kpfetcqjvyspecxwzisw.supabase.co
VITE_SUPABASE_ANON_KEY=[key set in .env]
```

### 3. Database (Already Created)
- All tables created
- RLS policies configured
- Indexes added

### 4. Next Steps
1. Create auth pages (Login, Register)
2. Create layout components (MainLayout, Sidebar, TopBar)
3. Create Dashboard page
4. Create POS page
5. Create other pages
6. Update routing
7. Test all features
8. Run lint and fix issues

## 📞 API Usage Examples

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, store, signIn, signUp, signOut } = useAuth();

// Login
await signIn('user@example.com', 'password');

// Register
await signUp('user@example.com', 'password', {
  businessName: 'My Store',
  businessType: 'Bar / Tavern',
  region: 'Khomas',
  town: 'Windhoek',
  phone: '0811234567',
});

// Logout
await signOut();
```

### Database Operations
```typescript
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSales,
  createSale,
  getCustomers,
  createCustomer,
} from '@/services/database';

// Get all products
const products = await getProducts();

// Create product
const product = await createProduct({
  store_id: store!.id,
  name: 'Product Name',
  price: 100,
  cost: 70,
  stock: 50,
  threshold: 10,
  category: 'Groceries',
  active: true,
});

// Update product
await updateProduct(productId, { stock: 45 });

// Create sale with items
const sale = await createSale(
  {
    store_id: store!.id,
    customer_name: 'Walk-in',
    subtotal: 100,
    vat: 15,
    total: 115,
    payment_method: 'cash',
    cashier_name: user!.email!,
    status: 'Completed',
    sale_date: getTodayISO(),
  },
  [
    {
      product_name: 'Product 1',
      quantity: 2,
      unit_price: 50,
      line_total: 100,
    },
  ]
);
```

### Formatting
```typescript
import { formatCurrency, calculateVAT, calculateTotal } from '@/lib/format';

const subtotal = 100;
const vat = calculateVAT(subtotal); // 15
const total = calculateTotal(subtotal); // 115
const display = formatCurrency(total); // "N$115.00"
```

## 🎯 Feature Checklist

### Must Have (MVP)
- [x] Database schema
- [x] Authentication context
- [x] Type definitions
- [x] Utility functions
- [x] Constants
- [x] Database services
- [x] Logo component
- [x] Barcode scanner
- [ ] Auth pages
- [ ] Main layout
- [ ] Dashboard
- [ ] POS system
- [ ] Inventory management

### Should Have
- [ ] Customer management
- [ ] Expense tracking
- [ ] Financial reports
- [ ] Staff management

### Nice to Have
- [ ] Returns processing
- [ ] Store credits
- [ ] Stock history
- [ ] Mobile app packaging
- [ ] Receipt printing
- [ ] Email notifications

## 📊 Progress Summary

**Completed**: 40%
- ✅ Database (100%)
- ✅ Backend Services (100%)
- ✅ Type System (100%)
- ✅ Utilities (100%)
- ✅ Core Components (50%)
- ⏳ Pages (0%)
- ⏳ Routing (0%)
- ⏳ Testing (0%)

**Next Priority**: Create authentication pages and main layout
