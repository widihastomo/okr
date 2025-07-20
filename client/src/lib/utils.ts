import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).format(dateObj);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getUserInitials(user: { name?: string; firstName?: string; lastName?: string } | null | undefined): string {
  if (!user) return "U";
  
  // Use consolidated name field if available
  if (user.name) {
    const nameParts = user.name.trim().split(' ').filter(Boolean);
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + (nameParts[nameParts.length - 1]?.charAt(0) || '')).toUpperCase();
  }
  
  // Fallback to firstName/lastName if name is not available
  const first = user.firstName?.charAt(0)?.toUpperCase() || '';
  const last = user.lastName?.charAt(0)?.toUpperCase() || '';
  return (first + last) || 'U';
}