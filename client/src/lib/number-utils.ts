/**
 * Utility functions for number formatting with thousand separators
 */

/**
 * Format number with Indonesian thousand separators (dot as thousand separator)
 * Example: 1000000 -> "1.000.000"
 */
export function formatNumberWithSeparator(value: string | number): string {
  if (!value && value !== 0) return "";
  
  // Convert to string and remove any existing separators
  const numStr = value.toString().replace(/\./g, "");
  
  // Handle decimal numbers
  const parts = numStr.split(",");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return with decimal part if exists
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
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
  // Remove all non-digit characters except comma for decimal
  const cleaned = value.replace(/[^\d,]/g, "");
  
  // Format with thousand separators
  const formatted = formatNumberWithSeparator(cleaned);
  
  onChange(formatted);
}

/**
 * Convert formatted string to raw number string for form submission
 */
export function getNumberValueForSubmission(formattedValue: string): string {
  const numericValue = parseFormattedNumber(formattedValue);
  return numericValue.toString();
}