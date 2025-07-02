/**
 * Utility functions for number formatting with thousand separators
 */

/**
 * Format number with Indonesian thousand separators (dot as thousand separator)
 * Example: 1000000 -> "1.000.000", 7500.5 -> "7.500,5"
 */
export function formatNumberWithSeparator(value: string | number): string {
  if (!value && value !== 0) return "";
  
  // Convert to string and handle different input formats
  let numStr = value.toString();
  
  // Remove existing thousand separators (dots) but keep decimal comma
  numStr = numStr.replace(/\.(?=\d{3})/g, "");
  
  // Handle decimal numbers (split by comma)
  const parts = numStr.split(",");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add thousand separators to integer part only
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

/**
 * Parse formatted number string back to number
 * Example: "1.000.000" -> 1000000
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  
  // Remove thousand separators (dots) and convert comma to decimal point
  const cleanValue = value.replace(/\./g, "").replace(/,/g, ".");
  
  return parseFloat(cleanValue) || 0;
}

/**
 * Handle input change for formatted number inputs
 */
export function handleNumberInputChange(
  value: string,
  onChange: (value: string) => void
) {
  // Allow digits, comma for decimal, and dots for thousands
  let cleaned = value.replace(/[^\d,\.]/g, "");
  
  // Handle multiple commas - only allow one comma
  const commaCount = (cleaned.match(/,/g) || []).length;
  if (commaCount > 1) {
    const firstCommaIndex = cleaned.indexOf(',');
    cleaned = cleaned.substring(0, firstCommaIndex + 1) + cleaned.substring(firstCommaIndex + 1).replace(/,/g, '');
  }
  
  // Split by comma to handle integer and decimal parts separately
  const parts = cleaned.split(',');
  const integerPart = parts[0] || '';
  const decimalPart = parts[1];
  
  // Remove existing dots from integer part and add thousand separators
  const cleanInteger = integerPart.replace(/\./g, '');
  const formattedInteger = cleanInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Combine with decimal part if exists
  const result = decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
  
  onChange(result);
}

/**
 * Convert formatted string to raw number string for form submission
 */
export function getNumberValueForSubmission(formattedValue: string): string {
  const numericValue = parseFormattedNumber(formattedValue);
  return numericValue.toString();
}