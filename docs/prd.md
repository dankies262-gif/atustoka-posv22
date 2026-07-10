# Requirements Document

## 1. Application Overview

### Application Name
AtuStoka POS

### Application Description
AtuStoka POS is a comprehensive point-of-sale and business management system designed specifically for Namibian retail businesses including bars, taverns, bottle stores, supermarkets, and general dealers. The system supports offline-first operation with cloud sync capabilities, multi-store management, role-based permissions, inventory management, sales tracking, expense recording, customer management, and financial reporting — all using Namibian Dollar (N$) currency.

### Visual Identity
- **Logo Design**: Creative logo combining shopping trolley icon with dollar sign symbol
- **Color Theme**: Dark green (#166534) and white for business owner interface; Dark blue/indigo for admin interface
- **Logo Usage**: Sidebar navigation, login page header, browser favicon

## 2. User & Usage Scenarios

### Target Users
- Business Owners: Full system access, financial oversight, business configuration, multi-store management
- Managers: Operational management, staff oversight, reporting access
- Cashiers: POS operations, customer transactions, basic inventory checks (cannot add/edit products)
- Barmen/Waiters: Order taking, sales processing, customer service (cannot add/edit products)
- Stock Controllers: Inventory management, stock adjustments, supplier coordination
- Platform Administrators: System monitoring, user management, platform statistics, account creation, user activation/deactivation, admin account management

### Core Usage Scenarios
- Daily sales transactions with multiple payment methods (cash, card, mobile money)
- Offline sales processing with automatic sync when online
- Real-time inventory tracking with low-stock alerts
- Offline stock tracking with sync when online
- Customer credit management and loyalty tracking
- Staff shift management and performance monitoring
- Expense recording and financial reporting
- Returns and refunds processing
- Barcode scanning for quick product lookup and sales
- Offline operation with automatic cloud synchronization when online
- Managing multiple stores/businesses from single account
- Platform monitoring, user analytics, and account creation for system administrators
- Password recovery via phone number lookup for business owners
- Administrator self-registration with auto-generated unique 5-digit PIN
- Main admin adding other admin accounts with auto-generated PINs
- User account activation and deactivation by administrators
- Auto-generating product codes for items without barcodes

## 3. Page Structure & Functionality

### Page Hierarchy
```
AtuStoka POS
├── Authentication
│   ├── Login Page
│   ├── Forgot Password Page
│   └── Registration Page (2-step)
├── Layout Components
│   ├── Sidebar Navigation (Business Owner)
│   ├── Sidebar Navigation (Admin)
│   ├── Top Bar (Mobile)
│   ├── Store Switcher
│   └── Main Layout Container
├── Main Application (Post-Login)
│   ├── Dashboard (Business Owner)
│   ├── Point of Sale (POS)
│   ├── Inventory Management
│   ├── Customer Management
│   ├── Expense Tracking
│   ├── Financial Reports
│   ├── Returns Processing
│   ├── Store Credits
│   ├── Stock History
│   ├── Staff Management
│   └── My Stores
└── Platform Administration
    ├── Admin Registration Page (/admin/register)
    └── Admin Dashboard (/admin)
        ├── Top Header
        ├── Platform Statistics
        ├── Users & Accounts Management Table
        ├── Create Account Modal
        ├── Add Admin Modal
        ├── Deactivate User Confirmation Modal
        └── Change PIN Modal
```

### Page-by-Page Functionality

#### Authentication Pages

**Login Page**
- Logo display at top center
- Phone number input field (primary identifier)
- Email input field (secondary identifier, optional)
- Password input field
- Sign in button with loading state
- Forgot Password link
- Tab to switch to registration
- Demo credentials display for testing
- Error message display for invalid credentials
- Offline mode indicator
- Authentication via Supabase Auth using phone number OR email
- Successful login redirects to Dashboard (business owner) or Admin Dashboard (admin)
- After admin login, allow through to /admin dashboard

**Forgot Password Page**
- Logo display at top
- Phone number input field (required)
- Submit button
- Back to Login link
- Phone number lookup finds associated account
- Triggers Supabase password reset email to account's registered email address
- Success message: Password reset link sent to your email
- Error message if phone number not found

**Registration Page (Step 1: Business Information)**
- Logo display at top
- Business name input (required)
- Business type selection: Bar/Tavern, Bottle Store, Retail Shop, Supermarket, Restaurant, Pharmacy, General Dealer, Other (required)
- Region selection from 14 Namibian regions (required)
- Town/city input (optional)
- Progress indicator showing Step 1 of 2
- Next button to proceed to Step 2
- Validation for required fields

**Registration Page (Step 2: Owner Information)**
- Logo display at top
- Owner full name input (required)
- Phone number input (required, primary identifier, MTC/TN Mobile format)
- Email address input (optional, secondary identifier)
- Password input with minimum 8 characters (required)
- Confirm password input (required)
- Domain restriction: @atustoka.com email addresses blocked from public registration
- Back button to return to Step 1
- Create Account button
- Password match validation
- Account creation via Supabase Auth with automatic login
- Creates first store with business information from Step 1
- Redirect to Dashboard after successful registration

#### Platform Administration Pages

**Admin Registration Page (/admin/register)**
- Public page accessible without login
- Logo display at top
- Page title: Administrator Registration
- Full name input (required)
- Email input (required, must be Gmail or @atustoka.com domain)
- Profile photo upload (required)
- Password input with minimum 8 characters (required)
- Confirm password input (required)
- Create Admin Account button
- Email uniqueness validation: reject duplicate emails
- Domain validation: only Gmail or @atustoka.com emails allowed
- Password match validation
- Account creation via Supabase Auth
- After successful account creation, system auto-generates unique 5-digit PIN
- PIN displayed once in success message: Your account created. Your PIN is: 12345. Save this PIN securely.
- PIN stored hashed in profiles.admin_pin using bcrypt
- Profile photo uploaded to storage and URL saved in profiles.avatar_url
- After registration complete, redirect to /admin dashboard
- Error messages for invalid email domain, duplicate email, password mismatch

**Admin Dashboard (/admin)**
- Standalone full-page layout (NOT using green business MainLayout)
- Indigo/dark blue theme throughout
- Top header bar:
  - AtuStoka Admin branding/logo on left
  - Logged-in admin profile photo and name display
  - Add Admin button (visible only to System Administrator)
  - Change PIN button (opens Change PIN Modal)
  - Logout button
- Platform Statistics Cards (4 cards in row):
  - Total Accounts: Count of all registered accounts (admins + business owners)
  - Active Accounts: Count of accounts with is_active = true
  - Deactivated Accounts: Count of accounts with is_active = false
  - Total Stores: Count of all stores across platform
- Create Account button in header area (opens Create Account Modal)
- Search and Filter Bar:
  - Search input: search by name or email
  - Role filter dropdown: All / Admin / Owner
  - Status filter dropdown: All / Active / Deactivated
- Users & Accounts Management Table:
  - Columns: Name, Email, Role, Status, Joined Date, Actions
  - Name column: full name in bold
  - Email column: email address
  - Role column: badge (Admin: indigo badge / Owner: teal badge)
  - Status column: badge (Active: green badge / Deactivated: red badge)
  - Joined Date column: registration date in monospace
  - Actions column: Activate / Deactivate toggle button
  - Deactivate button triggers Deactivate User Confirmation Modal (requires PIN)
  - Activate button directly activates user (no PIN required)
  - Table shows ALL accounts (both admins and business owners)
  - Sortable by joined date
  - Filtered results update table in real-time

**Create Account Modal**
- Account Type selection: Administrator OR Business Owner
- **For Administrator Account**:
  - Full name input (required)
  - Email input (required, must be Gmail or @atustoka.com)
  - Profile photo upload (required)
  - Password input (required)
  - Confirm password input (required)
  - Email uniqueness validation
  - Domain validation for Gmail or @atustoka.com
- **For Business Owner Account**:
  - Business name input (required)
  - Business type dropdown (required)
  - Region dropdown (required)
  - Town/city input (optional)
  - Owner full name input (required)
  - Phone number input (required)
  - Email input (optional)
  - Password input (required)
  - Confirm password input (required)
- Create Account and Cancel buttons
- Success message after account creation
- For Business Owner accounts, automatically creates first store
- For Administrator accounts created via this modal, system auto-generates unique 5-digit PIN and displays once in success message

**Add Admin Modal**
- Visible only to System Administrator (main admin)
- Modal title: Add Administrator
- Full name input (required)
- Email input (required, must be Gmail or @atustoka.com)
- Profile photo upload (required)
- Password input (required)
- Confirm password input (required)
- Email uniqueness validation: reject duplicate emails
- Domain validation for Gmail or @atustoka.com
- Add Admin and Cancel buttons
- After successful account creation, system auto-generates unique 5-digit PIN
- PIN displayed once in success message: Admin account created. PIN: 12345. Share this PIN securely with the new admin.
- PIN stored hashed in profiles.admin_pin using bcrypt
- Profile photo uploaded to storage and URL saved in profiles.avatar_url

**Deactivate User Confirmation Modal**
- Triggered when admin clicks Deactivate button
- Modal title: Confirm Deactivation
- User information display: name and email of user being deactivated
- Warning message: This action will prevent the user from logging in
- 5-digit PIN input field (required)
- Confirm Deactivation button
- Cancel button
- PIN verification against admin's stored admin_pin hash
- If PIN correct, call admin-toggle-user-status edge function with action: deactivate
- If PIN incorrect, show error: Incorrect PIN
- Success message after deactivation complete

**Change PIN Modal**
- Triggered from Change PIN button in admin header
- Modal title: Change Your Admin PIN
- Current PIN input (required)
- New 5-digit PIN input (required)
- Confirm new PIN input (required)
- Save button
- Cancel button
- Validates current PIN against stored hash
- Validates new PIN match
- Updates admin_pin in profiles table with new hashed PIN
- Success message after PIN changed
- Error messages for incorrect current PIN or new PIN mismatch

#### Layout Components

**Sidebar Navigation (Business Owner - Desktop)**
- Fixed left sidebar (232px width)
- Logo and app name at top
- Active store name and type display
- Store switcher button (opens store selection modal)
- Navigation items grouped:
  - Dashboard
  - TEAM group: Point of Sale
  - Customers, Inventory, Expenses, Reports, Returns, Store Credits, Stock History
  - SECURITY group: Staff
  - STORES group: My Stores
- Each item shows icon and label
- Active item highlighted with teal background and border
- Cloud sync status indicator (Supabase connected / Offline mode)
- Sync status shows: Synced, Syncing, Offline with pending changes
- User profile section at bottom:
  - Avatar with initials
  - User name and role
  - Online status indicator
  - Sign Out button

**Sidebar Navigation (Admin - Desktop)**
- NOT USED in new admin dashboard (admin dashboard uses top header layout instead)

**Top Bar (Mobile)**
- Hamburger menu button (opens Sheet component)
- App logo and name
- Active store name badge (business owner only)
- Live status badge
- Sync status indicator (Synced / Syncing / Offline)
- Current date display
- Notification bell icon
- User avatar

**Store Switcher Modal**
- Current active store highlighted
- List of user's stores with name, type, and region
- Switch button for each store
- Create New Store button
- Close button

**Mobile Navigation Sheet**
- Slides in from left using Sheet component
- Contains same navigation items as desktop sidebar
- Tap outside or close button to dismiss

**Main Layout Container**
- Wraps all authenticated pages
- Responsive layout with sidebar and content area
- Handles mobile/desktop view switching

#### Dashboard (Business Owner)

**Summary Statistics Cards**
- Today's Revenue: Total sales amount with transaction count
- Cash Sales: Cash collected today
- Outstanding Credit: Total customer credit owed with customer count
- Inventory Value: Total stock value with low-stock item count
- Returns/Refunds: Total returns processed today with count (quick-stat card with navigation shortcut to /returns)

**7-Day Sales Trend Chart**
- Bar chart showing daily revenue for past 7 days using Recharts library
- Best day, total week revenue, and average per day metrics

**Payment Methods Breakdown**
- Pie chart showing transaction distribution by payment method using Recharts
- Displays: Cash, Card/POS, MTC MoMo, PayToday, EasyWallet, Blue Wallet, FNB eWallet, OBank, Store Credit

**Staff on Duty Panel**
- Grid of active staff members
- Each card shows: staff name, role, shift time, status badge
- Color-coded by role (Owner: amber, Manager: teal, Cashier: green, Barman: purple, Waiter: blue)

**Low Stock Alert Panel**
- Displays when products fall below threshold
- Lists product names with remaining quantity
- Warning styling with amber color scheme

**Recent Transactions Table**
- Last 6 sales transactions
- Columns: Customer, Payment Method, Cashier, Total, Date
- Payment method badges with icons

#### Point of Sale (POS)

**Product Selection Area**
- Search bar for name, SKU, barcode, or product code lookup
- Scan button to activate barcode scanner
- Category filter pills (All, Beer & Cider, Spirits, Soft Drinks, Energy Drinks, Water, Tobacco, Groceries, Snacks, Dairy, Household, Pharmacy, Other)
- Product grid with cards showing:
  - Product icon
  - Product name
  - Price in N$
  - Current stock quantity
  - Visual indicator if item is in cart
  - Low stock warning (amber) or out of stock (disabled)
- Click product to add to cart

**Cart Panel (Right Side)**
- Cart header showing item count
- Clear cart button
- Customer name input field (defaults to Walk-in)
- Scrollable cart items list showing:
  - Product name
  - Unit price
  - Quantity controls (- and + buttons)
  - Line total
- Subtotal calculation
- VAT 15% calculation
- Total amount in large display
- Pay button (disabled when cart empty)

**Barcode Scanner Modal**
- Live camera viewfinder with corner markers
- Scanning animation line
- Start/Stop camera controls
- Manual barcode entry field as fallback
- Auto-detection using reliable barcode scanning library
- Supports desktop webcam and mobile rear camera
- Success confirmation when barcode detected
- Error handling for camera access denial
- Detected barcode automatically searches product database

**Payment Processing Screen**
- Amount due display in large format
- Payment method selection grid:
  - Cash (live)
  - Card/POS (requires API)
  - MTC MoMo (requires API)
  - PayToday (requires API)
  - EasyWallet (requires API)
  - Blue Wallet (requires API)
  - FNB eWallet (requires API)
  - OBank (requires API)
  - Store Credit (live)
- Each method shows icon, label, and API status
- Method-specific instructions panel
- For cash: cash given input, change calculation display
- For electronic methods: reference/confirmation number input
- Back button to return to cart
- Confirm payment button with amount

**Receipt Screen**
- Success checkmark icon
- Receipt number display
- Customer name
- Itemized list with quantities and prices
- Subtotal, VAT, and total breakdown
- Payment method badge with details (cash given, change, reference)
- Print button
- New Sale button to start fresh transaction

#### Inventory Management

**Inventory Header**
- Total product count and low stock count
- Scan to Add button (opens barcode scanner) - visible only to Owner, Manager, Stock Controller
- Add Product button - visible only to Owner, Manager, Stock Controller

**Search and Filter Bar**
- Search input for name, SKU, barcode, or product code
- Category dropdown filter

**Products Table**
- Columns: Product, SKU/Barcode/Code, Category, Cost, Price, Margin, Stock, Status, Actions
- Product column shows name and supplier
- SKU/Barcode/Code in monospace font (displays barcode if exists, otherwise product code)
- Category badge
- Cost and price in N$
- Margin percentage (color-coded: green >20%, amber ≤20%)
- Stock quantity (color-coded: red=0, amber=low, black=normal)
- Status badge (Out of Stock/Low Stock/In Stock)
- Action buttons: Edit, ±Stock, Delete - visible only to Owner, Manager, Stock Controller
- Cashiers and Barmen/Waiters can view product list but cannot access action buttons

**Add/Edit Product Modal**
- Accessible only to Owner, Manager, Stock Controller
- Product name input (required)
- SKU input
- Barcode input with scan button (optional)
- Auto-generated product code display (read-only, shown when barcode left blank)
- Selling price input in N$ (required)
- Cost price input in N$
- Current stock quantity input
- Low stock alert threshold input
- Category dropdown
- Supplier name input
- Save and Cancel buttons
- If barcode field left blank, system auto-generates unique alphanumeric product code (format: ATU-XXXXX)
- Product code stored in products.product_code field

**Stock Adjustment Modal**
- Accessible only to Owner, Manager, Stock Controller
- Current stock display
- Adjustment input (+24 for restock, -6 for loss)
- Reason input field
- Apply and Cancel buttons
- Updates stock quantity and records in history

#### Customer Management

**Customer Header**
- Total registered customer count
- Add Customer button

**Search Bar**
- Search by name or phone number

**Customer Cards Grid**
- Each card displays:
  - Customer initial avatar (color-coded by type)
  - Customer name
  - Phone number
  - Customer type badge (VIP: amber, Regular: teal, New: purple)
  - Three metric boxes:
    - Total spent (N$)
    - Visit count
    - Outstanding credit (N$, amber if >0)

**Add Customer Modal**
- Full name input (required)
- Phone number input
- Email input
- Customer type selection (New, Regular, VIP)
- Save and Cancel buttons

#### Expense Tracking

**Expense Header**
- Total expenses amount in N$ (red color)
- Add Expense button

**Add Expense Modal**
- Description input (required)
- Amount input in N$ (required)
- Category dropdown: Utilities, Payroll, Rent, Logistics, Marketing, Equipment, Operations, Other
- Date picker (defaults to today)
- Paid By input (Owner/Manager)
- Save and Cancel buttons

**Expenses Table**
- Columns: Date, Description, Category, Paid By, Amount
- Date in monospace format
- Description in bold
- Category badge (purple)
- Paid By in muted color
- Amount in N$ (red, bold)
- Sorted by date descending

#### Financial Reports

**Report Header**
- Page title and description
- Print button

**Financial Metrics Grid**
- Six metric cards:
  - Total Revenue (N$, teal, 📈)
  - Cost of Goods (N$, amber, 📦)
  - Gross Profit (N$, green, 💰)
  - Expenses (N$, red, 💸)
  - Net Profit (N$, green/red based on value, 📊)
  - Gross Margin (%, purple, %)

**Top Products Panel**
- Ranked list (1-5) of best-selling products using Recharts
- Each item shows: rank badge, product name, units sold, revenue in N$

**P&L Summary Panel**
- Line items with labels and amounts:
  - Revenue
  - Cost of Goods
  - Gross Profit
  - Expenses
  - Net Profit
- Color-coded amounts (revenue: dark, costs: red, profits: green)

#### Returns Processing

**Returns Header**
- Page title and description

**Returns Table**
- Columns: ID, Customer, Date, Total, Method, Status, Action
- Transaction ID in monospace (last 5 digits)
- Customer name in bold
- Date in monospace
- Total in N$
- Payment method badge
- Status badge (Completed: green, Returned: red)
- Return button (only for completed transactions)

**Process Return Modal**
- Customer name and transaction total display
- Return reason input field
- Confirm Return button (restocks inventory automatically)
- Cancel button

#### Store Credits

**Credits Header**
- Total outstanding credit amount in N$ (amber)

**Customer Credit Cards Grid**
- Each card displays:
  - Customer name
  - Current credit balance in N$ (large, amber if >0)
  - Phone number
  - Two action buttons:
    - + Credit button (amber)
    - Clear button (green, only shown if credit >0)

**Add Credit Modal**
- Customer name and current credit display
- Amount input in N$
- Note input field
- Add Credit and Cancel buttons

#### Stock History

**History Header**
- Page title and description

**Stock Movements Table**
- Columns: Date, Product, Movement, Type, Reference
- Date in monospace
- Product name in bold
- Movement quantity (green for +, red for -)
- Type badge (Sale: teal)
- Reference showing customer, payment method icon and label
- Sorted by transaction ID descending

#### Staff Management

**Staff Header**
- Active staff member count
- Add Staff button

**Add Staff Modal**
- Full name input (required)
- Role dropdown: Owner, Manager, Cashier, Barman, Waiter, Stock Controller, Other
- Shift dropdown: Morning, Afternoon, Evening, Night, All Day
- Phone number input
- 4-digit PIN input for POS login
- PIN usage hint text
- Save and Cancel buttons

**Staff Cards Grid**
- Each card displays:
  - Staff initial avatar (color-coded by role)
  - Staff name and phone
  - Role badge (color-coded)
  - Shift badge with clock icon (teal)
  - Hire date
  - Active/Inactive status badge

#### My Stores

**Stores Header**
- Total stores count
- Create New Store button

**Store Cards Grid**
- Each card displays:
  - Store name
  - Business type badge
  - Region and town
  - Active badge (if currently active store)
  - Creation date
  - Switch to This Store button (if not active)
  - Edit button
  - Delete button (disabled for active store)

**Create Store Modal**
- Business name input (required)
- Business type dropdown (required)
- Region dropdown (required)
- Town/city input (optional)
- Create and Cancel buttons

**Edit Store Modal**
- Same fields as Create Store Modal
- Pre-filled with existing store data
- Save and Cancel buttons

## 4. Business Rules & Logic

### Authentication & Authorization
- Users must register with business information before accessing system
- Registration is 2-step: business details first, then owner credentials
- Phone number is primary identifier field during registration (required)
- Email is optional/secondary identifier during registration
- Registration creates user account and first store simultaneously
- Phone number must be unique across all users
- Email must be unique if provided
- Password minimum 8 characters
- @atustoka.com email domain blocked from public registration
- Demo account available: demo@atustoka.na / Demo@1234
- Authentication handled by Supabase Auth
- Login supports phone number (primary) OR email (secondary) as identifier
- Successful login/registration redirects to Dashboard (business owner) or Admin Dashboard (admin)
- Role-based access controls inventory management features
- Superadmin role grants access to /admin panel
- Session persists in localStorage for offline access

### Role-Based Permissions
- **Owner, Manager, Stock Controller**: Full access to all features including adding/editing products and adjusting stock
- **Cashier, Barman, Waiter**: Can access POS for sales, view inventory (read-only), cannot add/edit products or adjust stock
- Inventory page Add Product and Scan to Add buttons hidden for Cashier, Barman, Waiter roles
- Product table action buttons (Edit, ±Stock, Delete) hidden for Cashier, Barman, Waiter roles
- Add/Edit Product Modal and Stock Adjustment Modal inaccessible to Cashier, Barman, Waiter roles

### Admin Registration & PIN Management
- Admin Registration Page (/admin/register) is public, accessible without login
- Only Gmail or @atustoka.com email domain allowed for admin registration
- Admin email must be unique across all admins (duplicate emails rejected)
- Admin must upload profile photo during registration
- After admin account created, system auto-generates unique 5-digit PIN
- PIN uniqueness enforced: each admin gets unique PIN across all admins
- PIN displayed once in success message after registration
- PIN stored hashed in profiles.admin_pin using bcrypt
- Profile photo uploaded to storage and URL saved in profiles.avatar_url
- After registration complete, admin redirected to /admin dashboard
- Admin can change PIN anytime via Change PIN button in admin header
- Change PIN requires current PIN verification before setting new PIN

### Password Recovery
- Forgot Password flow uses phone number lookup for business owners
- User enters phone number on Forgot Password page
- System finds account associated with phone number
- Triggers Supabase password reset email to account's registered email address
- User receives password reset link via email
- If phone number not found, show error message

### Admin Account Management
- Admin accounts (superadmin role) can be created via:
  - Admin Registration Page (/admin/register) by self-registration with Gmail or @atustoka.com email
  - Admin Dashboard Create Account Modal by existing admins
  - Add Admin Modal by System Administrator (main admin)
- System Administrator (main admin) has Add Admin button in admin dashboard header
- Add Admin Modal allows main admin to create other admin accounts
- Each new admin created via Add Admin Modal gets auto-generated unique 5-digit PIN
- PIN displayed once in success message for main admin to share securely
- Admin email rshilongo@atustoka.com is Google Workspace Gmail account
- Admins can create two types of accounts from Admin Panel:
  - Administrator accounts (superadmin role, auto-generated PIN)
  - Business Owner accounts (with first store)
- Public registration page blocks @atustoka.com domain
- Admin accounts never created via public self-registration (except /admin/register)
- All admin accounts require profile photo upload
- Email uniqueness enforced for all admin accounts

### User Activation & Deactivation
- All accounts have is_active boolean field (default true)
- Admins can activate or deactivate any user account from Admin Dashboard
- Deactivating user requires admin PIN confirmation
- Deactivate action:
  - Admin clicks Deactivate button
  - Deactivate User Confirmation Modal opens
  - Admin enters 5-digit PIN
  - System verifies PIN against admin's stored admin_pin hash
  - If correct, calls admin-toggle-user-status edge function with action: deactivate
  - Edge function uses service role to ban user in Supabase auth AND sets is_active = false in profiles
  - User cannot log in when deactivated
- Activate action:
  - Admin clicks Activate button
  - No PIN required for activation
  - Calls admin-toggle-user-status edge function with action: activate
  - Edge function unbans user in Supabase auth AND sets is_active = true in profiles
  - User can log in again when activated

### Multi-Store Management
- Each user can own multiple stores/businesses
- First store created during registration
- Additional stores created via My Stores page
- Only one store active at a time (active store context)
- All data (inventory, sales, customers, expenses, staff) scoped to active store
- Switching stores changes active context and reloads data
- Active store displayed in sidebar and top bar
- Cannot delete active store
- Store data isolated by store_id in database

### Inventory Management
- Products require name and price at minimum
- SKU and barcode are optional
- If barcode field left blank during product creation, system auto-generates unique alphanumeric product code
- Product code format: ATU-XXXXX (e.g. ATU-00142)
- Product code stored in products.product_code field
- Product code uniqueness enforced within store
- Products can be searched by name, SKU, barcode, or product code
- Stock quantity cannot go below 0
- Low stock threshold defaults to 5 units
- Products can be marked inactive (soft delete)
- Stock adjustments can be positive (restock) or negative (loss/damage)
- Stock adjustments accessible only to Owner, Manager, Stock Controller
- Barcode scanning uses reliable library for real barcode detection
- Scanner works on desktop webcam and mobile rear camera
- Detected barcode automatically searches product in active store

### Offline Functionality
- App operates fully offline using localStorage
- Business owners can track stock offline
- Cashiers can process sales offline
- All offline changes queued for sync
- When online connection restored, queued changes automatically sync to Supabase
- Sync status displayed in sidebar and top bar: Synced / Syncing / Offline
- Offline indicator shows when no internet connection
- Pending changes indicator shows when offline changes waiting to sync
- Sync conflicts resolved using last-write-wins strategy
- Critical operations (sales, stock adjustments) prioritized during sync

### Sales Processing
- Cart items cannot exceed available stock
- VAT is fixed at 15% of subtotal
- Total = Subtotal + VAT
- Customer defaults to Walk-in if not specified
- Cash payments require cash given ≥ total, calculates change
- Electronic payment methods require confirmation/reference number
- Store credit adds to customer's credit balance
- Completed sales automatically reduce product stock
- Sales processed offline stored locally and synced when online
- Each sale records: items, quantities, prices, payment method, cashier, date, reference
- Sales data scoped to active store

### Customer Management
- Customers can be New, Regular, or VIP
- System tracks total spent, visit count, and credit balance
- Credit balance increases when using Store Credit payment
- Credit can be manually added with reason note
- Credit can be cleared (set to 0) when paid
- Customers scoped to active store

### Returns Processing
- Only completed sales can be returned
- Returns automatically restock inventory
- Return reason must be provided
- Returned transactions marked with Returned status
- Cannot return same transaction twice
- Returns section visible on business owner dashboard as quick-stat card
- Dashboard shows total returns processed today with count
- Quick navigation shortcut to /returns from dashboard

### Expense Tracking
- Expenses categorized into 8 types
- Each expense records amount, category, date, and who paid
- Expenses reduce net profit in financial reports
- Expenses scoped to active store

### Financial Calculations
- Revenue = Sum of all sale totals
- Cost of Goods Sold (COGS) = Sum of (product cost × quantity sold)
- Gross Profit = Revenue - COGS
- Net Profit = Gross Profit - Expenses
- Gross Margin = (Gross Profit / Revenue) × 100%
- Product Margin = ((Price - Cost) / Price) × 100%
- All calculations based on active store data

### Data Persistence
- Backend uses Supabase with pre-configured tables
- All data stored in localStorage by default
- When Supabase configured, data syncs to cloud
- Offline changes queued and synced when connection restored
- Each store's data namespaced by store_id
- User can own multiple stores, each with isolated data
- Offline-first: app works without internet, syncs when online
- Data includes: products, sales, customers, expenses, staff, stores
- Database schema additions:
  - profiles.admin_pin TEXT (stores bcrypt hash of 5-digit PIN)
  - profiles.is_active BOOLEAN DEFAULT true NOT NULL
  - profiles.avatar_url TEXT (stores profile photo URL)
  - products.product_code TEXT (stores auto-generated product code for items without barcodes)

### Platform Administration
- Superadmin role assigned manually in database or via Admin Panel
- Admin dashboard at /admin visually distinct from business owner dashboard
- Admin dashboard uses standalone full-page layout with top header (NOT green business MainLayout)
- Admin dashboard uses indigo/dark blue color theme
- Admin dashboard header displays admin profile photo and name
- Admin dashboard shows platform-wide statistics:
  - Total Accounts (admins + business owners)
  - Active Accounts (is_active = true)
  - Deactivated Accounts (is_active = false)
  - Total Stores
- Admin dashboard shows Users & Accounts Management Table with ALL accounts
- Admins can view all users and stores
- Admins can activate/deactivate user accounts
- Deactivating user requires admin PIN confirmation
- Activating user does not require PIN
- Admins can create new Administrator and Business Owner accounts
- System Administrator (main admin) can add other admins via Add Admin button
- Admin panel read-only for user/store data (except activate/deactivate)
- Platform statistics aggregated from all stores

### Payment Method Status
- Cash: Fully functional (live)
- Store Credit: Fully functional (live)
- Card/POS, MTC MoMo, PayToday, EasyWallet, Blue Wallet, FNB eWallet, OBank: Require API integration (not live)
- Non-live methods show instructions and accept reference numbers

## 5. Exception & Edge Cases

| Scenario | Handling |
|----------|----------|
| User tries to add out-of-stock product to cart | Product card disabled, click has no effect |
| User tries to increase cart quantity beyond stock | Quantity does not increase, remains at stock limit |
| Camera access denied for barcode scanner | Show error message, provide manual entry fallback |
| Barcode not found in inventory | Search field populated with barcode for manual product lookup |
| User enters cash less than total | Pay button remains disabled, no error shown |
| Passwords don't match during registration | Show error: Passwords do not match |
| Email already registered | Show error: Email already registered |
| Phone number already registered | Show error: Phone number already registered |
| Required fields empty on form submit | Show error: Fill all required fields |
| User tries to register with @atustoka.com email | Show error: This domain is restricted |
| User enters phone number on Forgot Password page | System looks up account, sends reset email to registered email |
| Phone number not found on Forgot Password page | Show error: Phone number not found |
| User without email tries Forgot Password | Show error: No email associated with this phone number |
| Non-admin tries to access /admin route | Redirect to Dashboard with error message |
| Admin tries to create account with duplicate email | Show error: Email already exists |
| Admin tries to create account with duplicate phone | Show error: Phone number already exists |
| Admin tries to register with non-Gmail/non-@atustoka.com email on /admin/register | Show error: Only Gmail or @atustoka.com emails allowed |
| Admin tries to register with duplicate email | Show error: Email already exists |
| Admin does not upload profile photo during registration | Show error: Profile photo required |
| System generates duplicate PIN (edge case) | Regenerate PIN until unique |
| Admin enters incorrect PIN in Deactivate User Confirmation Modal | Show error: Incorrect PIN |
| Admin enters incorrect current PIN in Change PIN Modal | Show error: Incorrect current PIN |
| New admin PINs don't match in Change PIN Modal | Show error: New PINs do not match |
| Deactivated user tries to log in | Show error: Account deactivated, contact administrator |
| Admin tries to deactivate their own account | Allow action (no special restriction) |
| Non-System Administrator tries to access Add Admin button | Button not visible |
| User adds product without barcode | System auto-generates unique product code (ATU-XXXXX) |
| Product code generation collision (edge case) | Regenerate code until unique within store |
| User searches for product by product code | Search returns matching product |
| Cashier tries to access Add Product button | Button not visible |
| Cashier tries to access Edit/±Stock/Delete buttons | Buttons not visible |
| Cashier tries to open Add/Edit Product Modal | Modal inaccessible |
| Barman tries to adjust stock | Stock Adjustment Modal inaccessible |
| Internet connection lost during operation | Operation saved to localStorage, queued for sync |
| Internet connection restored | Queued changes automatically sync to Supabase |
| Sync conflict occurs | Last-write-wins strategy applied |
| User processes sale offline | Sale stored locally, synced when online |
| User adjusts stock offline | Adjustment stored locally, synced when online |
| Multiple offline changes pending | All changes synced in order when online |
| Sync fails due to server error | Retry sync automatically after delay |
| Network error during Supabase operation | Fall back to localStorage, show offline indicator |
| User logs out | Clear session, return to login screen, reset to dashboard |
| Low stock threshold reached | Product shows amber warning in inventory, appears in dashboard alert |
| Product stock reaches 0 | Product marked Out of Stock, disabled in POS |
| User attempts to return already-returned sale | Return button not shown for returned transactions |
| Mobile navigation sheet opened | Show overlay, close on outside tap or close button |
| Window resized | Sidebar auto-collapses below 769px, expands above |
| User switches stores | Active store context changes, all data reloads for new store |
| User tries to delete active store | Delete button disabled, show message: Cannot delete active store |
| Barcode scanner fails to detect barcode | User can manually enter barcode in fallback field |
| User creates store with duplicate name | Allow creation, stores distinguished by store_id |
| User has no stores (edge case) | Should not occur, first store created during registration |
| Admin creates Business Owner account | System automatically creates first store for that owner |
| User logs in with phone number | System authenticates via Supabase using phone as identifier |
| User logs in with email | System authenticates via Supabase using email as identifier |

## 6. Acceptance Criteria

1. User can register new account with 2-step process using phone number as primary identifier
2. Email is optional during registration
3. Registration creates user account and first store simultaneously
4. User can log in with phone number OR email via Supabase Auth
5. Successful login redirects to Dashboard (business owner) or Admin Dashboard (admin)
6. Admin Registration Page accessible at /admin/register without login
7. Admin Registration Page only accepts Gmail or @atustoka.com email domain
8. Admin Registration Page requires profile photo upload
9. Admin Registration Page enforces email uniqueness (rejects duplicate emails)
10. After admin account created, system auto-generates unique 5-digit PIN
11. PIN displayed once in success message after admin registration
12. PIN stored hashed in profiles.admin_pin using bcrypt
13. Profile photo uploaded to storage and URL saved in profiles.avatar_url
14. After registration complete, admin redirected to /admin dashboard
15. Admin Dashboard uses standalone full-page layout with top header (NOT green business MainLayout)
16. Admin Dashboard uses indigo/dark blue color theme throughout
17. Admin Dashboard top header shows AtuStoka Admin branding, admin profile photo and name, Add Admin button (System Administrator only), Change PIN button, Logout button
18. Admin Dashboard shows 4 platform statistics cards: Total Accounts, Active Accounts, Deactivated Accounts, Total Stores
19. Admin Dashboard shows Create Account button in header area
20. Admin Dashboard shows search and filter bar with search input, role filter, status filter
21. Admin Dashboard shows Users & Accounts Management Table with columns: Name, Email, Role, Status, Joined Date, Actions
22. Users & Accounts Management Table shows ALL accounts (admins and business owners)
23. Role column displays Admin badge (indigo) or Owner badge (teal)
24. Status column displays Active badge (green) or Deactivated badge (red)
25. Actions column shows Activate / Deactivate toggle button
26. Clicking Deactivate button opens Deactivate User Confirmation Modal
27. Deactivate User Confirmation Modal requires admin to enter 5-digit PIN
28. PIN verified against admin's stored admin_pin hash
29. If PIN correct, admin-toggle-user-status edge function called with action: deactivate
30. Edge function bans user in Supabase auth AND sets is_active = false in profiles
31. Deactivated user cannot log in
32. Clicking Activate button directly activates user (no PIN required)
33. Activate action calls admin-toggle-user-status edge function with action: activate
34. Edge function unbans user in Supabase auth AND sets is_active = true in profiles
35. Activated user can log in again
36. Change PIN button in admin header opens Change PIN Modal
37. Change PIN Modal requires current PIN, new PIN, confirm new PIN
38. Current PIN verified before allowing PIN change
39. New PIN stored hashed in profiles.admin_pin
40. Create Account Modal allows creating Administrator or Business Owner accounts
41. Administrator accounts created via Create Account Modal get auto-generated unique PIN displayed once
42. Business Owner accounts automatically create first store
43. Add Admin button visible only to System Administrator in admin dashboard header
44. Add Admin Modal allows main admin to create other admin accounts
45. Add Admin Modal requires full name, email (Gmail or @atustoka.com), profile photo, password, confirm password
46. Add Admin Modal enforces email uniqueness
47. After admin created via Add Admin Modal, system auto-generates unique 5-digit PIN
48. PIN displayed once in success message for main admin to share securely
49. Search and filter functionality updates table in real-time
50. Logo displays correctly on login, sidebar, and as favicon
51. Dashboard displays today's revenue, cash sales, outstanding credit, inventory value, and returns/refunds for active store
52. Returns section visible as quick-stat card on business owner dashboard
53. Dashboard provides navigation shortcut to /returns page
54. Dashboard shows 7-day sales trend chart using Recharts
55. Dashboard shows payment methods pie chart using Recharts
56. Dashboard lists staff on duty with role and shift
57. Dashboard shows low stock alert when products below threshold
58. Sidebar navigation shows all pages with icons including My Stores
59. Sidebar displays active store name and type
60. Sidebar shows sync status: Synced / Syncing / Offline
61. Store switcher button opens modal with list of user's stores
62. User can switch between stores via store switcher
63. Switching stores changes active context and reloads data
64. Mobile hamburger menu opens Sheet component with navigation
65. Active page highlighted in sidebar
66. Forgot Password page allows phone number entry
67. Forgot Password looks up account by phone and sends reset email
68. Error shown if phone number not found on Forgot Password page
69. @atustoka.com domain blocked from public registration
70. Non-superadmin redirected from /admin to Dashboard
71. POS allows searching products by name, SKU, barcode, or product code
72. POS allows filtering products by category
73. POS barcode scanner activates device camera using reliable library
74. Barcode scanner detects real product barcodes on desktop and mobile
75. POS allows manual barcode entry when camera unavailable
76. POS cart shows items with quantity controls and line totals
77. POS calculates subtotal, VAT 15%, and total correctly
78. POS supports 9 payment methods with appropriate UI
79. Cash payment calculates and displays change
80. Electronic payments accept reference numbers
81. Store credit payment adds to customer credit balance
82. Completed sale generates receipt with all details
83. Completed sale reduces product stock automatically
84. Sales processed offline stored locally and synced when online
85. Inventory page lists all products with stock levels for active store
86. Inventory Add Product and Scan to Add buttons visible only to Owner, Manager, Stock Controller
87. Inventory action buttons (Edit, ±Stock, Delete) visible only to Owner, Manager, Stock Controller
88. Cashiers and Barmen/Waiters can view inventory but cannot access action buttons
89. Inventory allows adding new products with all fields (Owner, Manager, Stock Controller only)
90. When adding product, if barcode field left blank, system auto-generates unique product code (ATU-XXXXX)
91. Product code stored in products.product_code field
92. Product code uniqueness enforced within store
93. Products table displays barcode if exists, otherwise product code
94. Inventory allows editing existing products (Owner, Manager, Stock Controller only)
95. Inventory allows stock adjustments with reason (Owner, Manager, Stock Controller only)
96. Inventory shows low stock and out of stock status
97. Barcode scanner in inventory adds or edits products (Owner, Manager, Stock Controller only)
98. Stock adjustments processed offline stored locally and synced when online
99. Customer page lists all customers for active store
100. Customer page allows adding new customers
101. Expense page lists all expenses for active store
102. Expense page allows recording new expenses
103. Reports page shows 6 financial metrics for active store
104. Reports page shows top 5 products chart using Recharts
105. Reports page shows P&L summary
106. Returns page lists all sales transactions for active store
107. Returns page allows processing returns with reason
108. Returns automatically restock inventory
109. Store Credits page shows customer credit balances for active store
110. Store Credits allows adding credit with note
111. Store Credits allows clearing credit balance
112. Stock History shows all inventory movements for active store
113. Staff page lists all staff members for active store
114. Staff page allows adding new staff with role and shift
115. My Stores page lists all stores owned by user
116. My Stores page allows creating new stores
117. My Stores page allows editing store details
118. My Stores page allows deleting stores (except active store)
119. Active store badge displayed on current store card
120. Sidebar shows cloud sync or offline status
121. Offline indicator shows when no internet connection
122. Pending changes indicator shows when offline changes waiting to sync
123. When online connection restored, queued changes automatically sync to Supabase
124. All currency displays use N$ format
125. All data persists via Supabase backend
126. App works fully offline with localStorage fallback
127. User can sign out and return to login
128. Demo account works for testing

## 7. Out of Scope for This Release

- Native mobile app packaging for iOS/Android app stores
- Live API integrations for electronic payment methods (Card, MTC MoMo, PayToday, EasyWallet, Blue Wallet, FNB eWallet, OBank)
- Multi-language support beyond English
- Advanced reporting with date range filters and export
- Product images and photo upload
- Receipt printer integration
- Email/SMS notifications for password reset (uses Supabase default email)
- Advanced user permissions and access control beyond role-based inventory restrictions
- Supplier management module
- Purchase order system
- Loyalty points program
- Discount and promotion engine
- Tax configuration beyond fixed 15% VAT
- Integration with accounting software
- Backup and restore functionality
- Data export to CSV/Excel
- Audit trail and activity logs
- Two-factor authentication
- Customer-facing display screen
- Kitchen/bar order printing
- Table management for restaurants
- Reservation system
- Employee time tracking and payroll
- Commission calculation
- Gift card management
- Store transfer functionality (moving products/data between stores)
- Consolidated reporting across multiple stores
- Store-level user permissions (restricting users to specific stores)
- Phone number verification via SMS OTP
- Email verification during registration
- Admin ability to edit user/store data beyond activate/deactivate
- Admin ability to delete user accounts
- Admin ability to reset user passwords directly
- Bulk user operations (bulk activate/deactivate)
- Admin activity logs and audit trail
- Admin role hierarchy (super admin vs regular admin)
- Self-service account recovery for deactivated users
- Manual PIN selection by admins (PIN is auto-generated)
- PIN recovery mechanism (admin must use Change PIN with current PIN)
- Barcode generation for products (only auto product code generation)
- Batch product import via CSV/Excel
- Product variants and options (size, color, etc.)
- Multi-currency support
- Custom receipt templates
- Customer email/SMS marketing campaigns
- Conflict resolution UI for sync conflicts (uses last-write-wins automatically)
- Manual sync trigger button (sync is automatic)
- Sync history and logs
- Offline data size limits and warnings
- Selective sync (all data syncs automatically)