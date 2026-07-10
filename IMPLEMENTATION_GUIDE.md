# AtuStoka POS - Complete Implementation Guide

## Overview
AtuStoka POS is a comprehensive point-of-sale and business management system for Namibian retail businesses including bars, taverns, bottle stores, and supermarkets.

## ✅ Completed Setup

### 1. Database (Supabase)
- ✅ Supabase initialized
- ✅ All tables created:
  - stores (business profiles)
  - products (inventory)
  - customers
  - sales & sale_items
  - expenses
  - staff
  - stock_movements
- ✅ RLS policies configured
- ✅ Indexes created for performance

### 2. Core Infrastructure
- ✅ TypeScript types defined (`src/types/database.ts`)
- ✅ Database service functions (`src/services/database.ts`)
- ✅ Utility functions (`src/lib/format.ts`)
- ✅ Constants (`src/lib/constants.ts`)
- ✅ Auth context updated (`src/contexts/AuthContext.tsx`)
- ✅ Barcode scanner component (`src/components/BarcodeScanner.tsx`)
- ✅ Logo component (`src/components/Logo.tsx`)
- ✅ CSS styling with teal theme (`src/index.css`)

### 3. Dependencies
- ✅ @supabase/supabase-js installed
- ✅ @ericblade/quagga2 installed (barcode scanning)
- ✅ All shadcn/ui components available

## 📋 Implementation Status

### Critical Files Created:
1. `/src/types/database.ts` - All TypeScript interfaces
2. `/src/lib/format.ts` - Currency and date formatting utilities
3. `/src/lib/constants.ts` - All constants (payment methods, categories, regions, etc.)
4. `/src/services/database.ts` - Complete database CRUD operations
5. `/src/components/Logo.tsx` - AtuStoka logo component
6. `/src/components/BarcodeScanner.tsx` - Camera barcode scanner with Quagga2
7. `/src/contexts/AuthContext.tsx` - Updated authentication context

### Pages to Implement:
The following pages need to be created in `/src/pages/`:

1. **Auth Pages**
   - `Login.tsx` - Email/password login
   - `Register.tsx` - 2-step registration (business info → owner info)

2. **Main Pages**
   - `Dashboard.tsx` - Statistics, charts, alerts
   - `POS.tsx` - Point of sale with cart and payment
   - `Inventory.tsx` - Product management
   - `Customers.tsx` - Customer management
   - `Expenses.tsx` - Expense tracking
   - `Reports.tsx` - Financial reports
   - `Returns.tsx` - Return processing
   - `StoreCredits.tsx` - Credit management
   - `StockHistory.tsx` - Stock movement history
   - `Staff.tsx` - Staff management

3. **Layout Components**
   - `layouts/MainLayout.tsx` - Sidebar + main content area
   - `layouts/Sidebar.tsx` - Navigation sidebar
   - `layouts/TopBar.tsx` - Mobile top bar

## 🎨 Design System

### Colors (Teal Theme)
- Primary: `#0D9488` (Teal-600)
- Success: `#10B981` (Green-500)
- Danger: `#EF4444` (Red-500)
- Warning: `#F59E0B` (Amber-500)
- Info: `#3B82F6` (Blue-500)

### Currency Format
All amounts display as: `N$123.45` using `formatCurrency()` from `lib/format.ts`

### Payment Methods
9 payment methods defined in `lib/constants.ts`:
- Cash (live)
- Card/POS
- MTC MoMo
- PayToday
- EasyWallet
- Blue Wallet
- FNB eWallet
- OBank
- Store Credit (live)

## 🔧 Key Features to Implement

### 1. Authentication Flow
- Login with email/password
- 2-step registration:
  - Step 1: Business name, type, region, town
  - Step 2: Owner name, phone, email, password
- Store creation on signup
- Protected routes

### 2. POS System
- Product grid with search and category filter
- Shopping cart with quantity controls
- Barcode scanner (camera + manual entry)
- Payment processing with 9 methods
- Cash change calculation
- Receipt generation
- Automatic stock reduction
- Customer credit tracking

### 3. Inventory Management
- Product CRUD operations
- Stock adjustment with reason tracking
- Low stock alerts (threshold-based)
- Barcode scanning for quick lookup
- Category filtering
- Supplier tracking

### 4. Dashboard
- Today's revenue, cash sales, credit, inventory value
- 7-day sales trend chart
- Payment methods breakdown
- Staff on duty panel
- Low stock alerts
- Recent transactions table

### 5. Financial Reports
- Revenue, COGS, Gross Profit, Net Profit
- Gross Margin calculation
- Top 5 products by revenue
- P&L summary
- Expense tracking by category

## 📱 Responsive Design

### Desktop (≥768px)
- Fixed sidebar (232px width)
- Main content area with top bar
- Grid layouts for cards

### Mobile (<768px)
- Collapsible sidebar overlay
- Hamburger menu
- Single column layouts
- Touch-friendly buttons (min 48px)

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Users can only access their own store's data
- Helper functions: `get_user_store_id()`, `user_owns_store()`
- Policies for SELECT, INSERT, UPDATE, DELETE

### Authentication
- Supabase Auth handles user management
- Store record created on signup
- Session management via AuthContext

## 📊 Database Schema

### Key Relationships
```
stores (1) ←→ (many) products
stores (1) ←→ (many) customers
stores (1) ←→ (many) sales
sales (1) ←→ (many) sale_items
stores (1) ←→ (many) expenses
stores (1) ←→ (many) staff
stores (1) ←→ (many) stock_movements
```

### Important Fields
- All prices/amounts: `DECIMAL(10,2)`
- All IDs: `UUID`
- Timestamps: `TIMESTAMPTZ`
- Soft delete: `active BOOLEAN` (products, staff)

## 🚀 Next Steps

### Immediate Actions:
1. Create all page components in `/src/pages/`
2. Create layout components in `/src/components/layouts/`
3. Update `/src/routes.tsx` with all routes
4. Update `/src/App.tsx` to use MainLayout
5. Test authentication flow
6. Test POS system with barcode scanner
7. Test all CRUD operations
8. Run `npm run lint` and fix issues

### Testing Checklist:
- [ ] User registration (2-step)
- [ ] User login
- [ ] Store creation
- [ ] Product CRUD
- [ ] Barcode scanning (camera + manual)
- [ ] POS cart management
- [ ] Payment processing (all 9 methods)
- [ ] Stock reduction on sale
- [ ] Customer credit tracking
- [ ] Expense recording
- [ ] Financial calculations
- [ ] Reports generation
- [ ] Returns processing
- [ ] Staff management
- [ ] Mobile responsiveness

## 📝 Code Examples

### Using Database Services
```typescript
import { getProducts, createProduct, updateProduct } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

// In component:
const { store } = useAuth();

// Fetch products
const products = await getProducts();

// Create product
const newProduct = await createProduct({
  store_id: store!.id,
  name: 'Windhoek Lager 24pk',
  price: 289.99,
  cost: 210,
  stock: 48,
  threshold: 12,
  category: 'Beer & Cider',
  active: true,
});

// Update stock
await updateProduct(productId, { stock: newStock });
```

### Using Format Utilities
```typescript
import { formatCurrency, calculateVAT, calculateTotal } from '@/lib/format';

const subtotal = 100;
const vat = calculateVAT(subtotal); // 15.00
const total = calculateTotal(subtotal); // 115.00
const display = formatCurrency(total); // "N$115.00"
```

### Using Barcode Scanner
```typescript
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const [showScanner, setShowScanner] = useState(false);

const handleScan = (code: string) => {
  setShowScanner(false);
  // Find product by barcode
  const product = products.find(p => p.barcode === code);
  if (product) {
    addToCart(product);
  }
};

<Dialog open={showScanner} onOpenChange={setShowScanner}>
  <DialogContent>
    <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
  </DialogContent>
</Dialog>
```

## 🎯 Business Rules

### VAT Calculation
- Fixed at 15% of subtotal
- Formula: `VAT = Subtotal × 0.15`
- Total = Subtotal + VAT

### Stock Management
- Stock cannot go below 0
- Low stock alert when `stock <= threshold`
- Automatic reduction on sale
- Manual adjustments tracked in stock_movements

### Customer Credit
- Increases when using "Store Credit" payment
- Can be manually added with reason
- Tracked per customer
- Displayed in dashboard alerts

### Payment Methods
- Cash: Requires cash_given ≥ total, calculates change
- Electronic: Requires reference number
- Store Credit: Adds to customer credit balance

## 📞 Support

For issues or questions:
- Check database logs in Supabase dashboard
- Review browser console for errors
- Verify RLS policies if data not showing
- Ensure user is authenticated
- Check store_id is set correctly

## 🔗 Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Quagga2 Docs: https://github.com/ericblade/quagga2
- shadcn/ui: https://ui.shadcn.com
- React Router: https://reactrouter.com

---

**Status**: Core infrastructure complete. Pages and routing need implementation.
**Priority**: Create auth pages → main layout → POS system → other pages
**Estimated Time**: 4-6 hours for full implementation
