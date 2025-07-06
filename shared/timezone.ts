/**
 * Timezone utilities for GMT+7 (WIB - Waktu Indonesia Barat)
 * Ensures consistent timezone handling across the entire application
 */

export const TIMEZONE = 'Asia/Jakarta'; // GMT+7
export const TIMEZONE_OFFSET = 7; // GMT+7

/**
 * Get current date in GMT+7 timezone
 */
export function getCurrentDateGMT7(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (TIMEZONE_OFFSET * 3600000));
}

/**
 * Get date string in YYYY-MM-DD format using GMT+7 timezone
 */
export function getTodayStringGMT7(): string {
  const today = getCurrentDateGMT7();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
}

/**
 * Convert any date to GMT+7 timezone
 */
export function toGMT7(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (TIMEZONE_OFFSET * 3600000));
}

/**
 * Format date to Indonesian locale with GMT+7 timezone
 */
export function formatDateIndonesian(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const gmt7Date = toGMT7(dateObj);
  return gmt7Date.toLocaleDateString("id-ID");
}

/**
 * Check if a date string (YYYY-MM-DD) is before today in GMT+7
 */
export function isBeforeTodayGMT7(dateString: string): boolean {
  const today = getTodayStringGMT7();
  return dateString < today;
}

/**
 * Check if a date string (YYYY-MM-DD) is today in GMT+7
 */
export function isTodayGMT7(dateString: string): boolean {
  const today = getTodayStringGMT7();
  return dateString === today;
}

/**
 * Get start of day in GMT+7 for date comparisons
 */
export function getStartOfDayGMT7(date?: Date): Date {
  const targetDate = date ? toGMT7(date) : getCurrentDateGMT7();
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Helper function to convert timezone for date operations
 * Used consistently across Daily Focus, Dashboard, DatePicker, and notifications
 */
export function getGMT7Date(): { date: Date; dateString: string } {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const gmt7Date = new Date(utc + (7 * 3600000)); // GMT+7
  
  const dateString = gmt7Date.getFullYear() + '-' + 
    String(gmt7Date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(gmt7Date.getDate()).padStart(2, '0');
  
  return { date: gmt7Date, dateString };
}