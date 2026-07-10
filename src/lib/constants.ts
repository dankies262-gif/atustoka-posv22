// Constants for AtuStoka POS
import type { PaymentMethod } from '@/types/database';

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', label: 'Cash', icon: '💵', color: '#10B981', live: true },
  { id: 'card', label: 'Card / POS', icon: '💳', color: '#3B82F6', live: false },
  { id: 'mtcmomo', label: 'MTC MoMo', icon: '📱', color: '#F97316', live: false },
  { id: 'paytoday', label: 'PayToday', icon: '🟢', color: '#16A34A', live: false },
  { id: 'easywallet', label: 'EasyWallet', icon: '🔵', color: '#2563EB', live: false },
  { id: 'bluewallet', label: 'Blue Wallet', icon: '🔷', color: '#1D4ED8', live: false },
  { id: 'ewallet', label: 'FNB eWallet', icon: '🟠', color: '#EA580C', live: false },
  { id: 'obank', label: 'OBank', icon: '🟡', color: '#CA8A04', live: false },
  { id: 'credit', label: 'Store Credit', icon: '🏷', color: '#8B5CF6', live: true },
  { id: 'split', label: 'Split (Cash+Credit)', icon: '🌓', color: '#6366F1', live: true },
];

export const CATEGORIES = [
  'Beer & Cider',
  'Spirits',
  'Soft Drinks',
  'Energy Drinks',
  'Water',
  'Tobacco',
  'Groceries',
  'Snacks',
  'Dairy',
  'Household',
  'Pharmacy',
  'Other',
];

export const BUSINESS_TYPES = [
  'Bar / Tavern',
  'Bottle Store',
  'Retail Shop',
  'Supermarket',
  'Restaurant',
  'Pharmacy',
  'General Dealer',
  'Other',
];

export const REGIONS = [
  'Khomas',
  'Erongo',
  'Oshana',
  'Omusati',
  'Ohangwena',
  'Oshikoto',
  'Otjozondjupa',
  'Omaheke',
  'Kavango East',
  'Kavango West',
  'Zambezi',
  'Kunene',
  'Hardap',
  'ǁKaras',
];

export const ROLES = [
  'Owner',
  'Manager',
  'Cashier',
  'Barman',
  'Waiter',
  'Stock Controller',
  'Other',
];

export const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'All Day'];

export const EXPENSE_CATEGORIES = [
  'Utilities',
  'Payroll',
  'Rent',
  'Logistics',
  'Marketing',
  'Equipment',
  'Operations',
  'Other',
];

export const CUSTOMER_TYPES = ['New', 'Regular', 'VIP'] as const;

export const ROLE_COLORS: Record<string, string> = {
  Owner: '#F59E0B',
  Manager: '#0D9488',
  Cashier: '#10B981',
  Barman: '#8B5CF6',
  Waiter: '#3B82F6',
  'Stock Controller': '#EC4899',
  Other: '#64748B',
};

export const PAYMENT_INSTRUCTIONS: Record<string, string> = {
  mtcmomo: `1. Customer opens MTC MoMo
2. Tap "Send Money"
3. Enter your MoMo number
4. Amount: {amount}
5. Confirm receipt on your phone before releasing goods`,
  paytoday: `1. Show your PayToday QR code
2. Customer scans and pays {amount}
3. You get a notification — confirm before releasing
Register: paytoday.na/merchant`,
  easywallet: `1. Customer opens Bank Windhoek app → EasyWallet
2. Amount: {amount} to your merchant number
3. Confirm receipt
Register: bankwindhoek.com.na`,
  bluewallet: `1. Customer opens Nedbank → Blue Wallet
2. Pay {amount} to your account
3. Wait for SMS confirmation
Register: nedbank.com.na`,
  ewallet: `1. Customer opens FNB app → eWallet → Send
2. Your FNB number, amount: {amount}
3. You receive SMS confirmation
Register: fnbnamibia.com.na`,
  obank: `1. Customer opens OBank app
2. Send {amount} to your account
3. Confirm before releasing goods
Register: oldmutual.com.na/obank`,
  credit: `1. Customer balance is automatically updated
2. Customer will owe {amount}
3. Remind customer of their remaining credit limit`,
  split: `1. Collect cash amount from customer
2. Remainder is automatically added to their store credit account
3. Cash portion goes into till`,
  card: `1. Enter {amount} on your card machine
2. Customer inserts / taps card and enters PIN
3. Wait for APPROVED on machine screen
4. Tear off slip then confirm below`,
};
