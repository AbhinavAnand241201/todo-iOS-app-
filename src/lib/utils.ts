import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDate(dateString: string | Date, formatStr: string = 'PPP'): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDateFns(date, formatStr);
  } catch (error) {
    // console.warn("Error formatting date:", dateString, error);
    // if dateString is already formatted or not a valid ISO, return as is or a placeholder
    return typeof dateString === 'string' ? dateString : 'Invalid Date';
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Helper to calculate percentage
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}
