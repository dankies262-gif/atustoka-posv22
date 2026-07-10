// Utility functions for AtuStoka POS

/**
 * Format number as Namibian Dollar currency
 */
export function formatCurrency(amount: number): string {
  return `N$${Number(amount || 0).toLocaleString('en-NA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-NA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

/**
 * Calculate VAT (15% inclusive)
 * The user indicated prices already include VAT.
 */
export function calculateVAT(total: number): number {
  // Extract 15% VAT from the inclusive total
  return Number((total - (total / 1.15)).toFixed(2));
}

/**
 * Calculate total (Subtotal + VAT = Total)
 * Since prices are inclusive, the sum IS the total.
 */
export function calculateTotal(sum: number): number {
  return Number(sum.toFixed(2));
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
