import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deterministic Indian Rupee (INR) formatter
 * Ensures 100% identical output on both SSR server and browser client,
 * completely preventing React hydration mismatch errors.
 * e.g. 100000 -> "₹1,00,000"
 */
export function formatINR(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '₹0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';

  const isNegative = num < 0;
  const absVal = Math.abs(Math.round(num));
  const str = absVal.toString();

  if (str.length <= 3) {
    return `${isNegative ? '-' : ''}₹${str}`;
  }

  let lastThree = str.substring(str.length - 3);
  const remaining = str.substring(0, str.length - 3);
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  return `${isNegative ? '-' : ''}₹${formattedRemaining},${lastThree}`;
}
