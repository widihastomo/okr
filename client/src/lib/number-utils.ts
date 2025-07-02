/**
 * Utility functions for number formatting with thousand separators
 */

/**
 * Format number with Indonesian thousand separators (dot as thousand separator)
 * Example: 1000000 -> "1.000.000", 7500.5 -> "7.500,5"
 */
export function formatNumberWithSeparator(value: string | number): string {
  if (!value && value !== 0) return "";
  
  // Convert to string
  let numStr = value.toString();
  
  // Handle decimal numbers (split by comma first)
  const parts = numStr.split(",");
  let integerPart = parts[0] || "";
  const decimalPart = parts[1];
  
  // Remove any existing dots from integer part
  integerPart = integerPart.replace(/\./g, "");
  
  // Add thousand separators to integer part only
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

/**
 * Parse formatted number string back to number
 * Example: "1.000.000" -> 1000000, "7.500,5" -> 7500.5
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  
  // Split by comma to handle decimal part properly
  const parts = value.split(',');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1];
  
  // Remove thousand separators (dots) from integer part
  const cleanInteger = integerPart.replace(/\./g, "");
  
  // Combine with decimal part using dot as decimal separator for parseFloat
  const cleanValue = decimalPart ? `${cleanInteger}.${decimalPart}` : cleanInteger;
  
  return parseFloat(cleanValue) || 0;
}

/**
 * Handle input change for formatted number inputs
 */
export function handleNumberInputChange(
  value: string,
  onChange: (value: string) => void
) {
  console.log('Input received:', value);
  
  // Allow only digits, one comma, and dots (we'll format the dots)
  let input = value.replace(/[^\d,]/g, "");
  console.log('After cleaning:', input);
  
  // Handle multiple commas - only keep the first one
  const commaIndex = input.indexOf(',');
  if (commaIndex !== -1) {
    const beforeComma = input.substring(0, commaIndex);
    const afterComma = input.substring(commaIndex + 1).replace(/,/g, ''); // Remove additional commas
    input = beforeComma + ',' + afterComma;
    console.log('After comma handling:', input);
  }
  
  // Apply formatting
  const formatted = formatNumberWithSeparator(input);
  console.log('Final formatted:', formatted);
  onChange(formatted);
}

/**
 * Convert formatted string to raw number string for form submission
 */
export function getNumberValueForSubmission(formattedValue: string): string {
  const numericValue = parseFormattedNumber(formattedValue);
  return numericValue.toString();
}