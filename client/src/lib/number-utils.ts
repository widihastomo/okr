/**
 * Utility functions for number formatting with thousand separators
 */

/**
 * Format number with Indonesian thousand separators (dot as thousand separator)
 * Example: 1000000 -> "1.000.000", 7500.5 -> "7.500,5"
 */
export function formatNumberWithSeparator(value: string | number): string {
  if (!value && value !== 0) return "";
  if (value === null || value === undefined) return "";
  
  // Convert to string safely
  let numStr = "";
  if (typeof value === "string") {
    numStr = value;
  } else if (typeof value === "number") {
    numStr = value.toString();
  } else {
    return "";
  }
  
  // Handle decimal numbers - first check if it's already in Indonesian format (with comma)
  let integerPart = "";
  let decimalPart = "";
  
  if (numStr.includes(",")) {
    // Indonesian format: "1.000,50"
    const parts = numStr.split(",");
    integerPart = parts[0] || "";
    decimalPart = parts[1];
  } else if (numStr.includes(".")) {
    // Check if it's a decimal number (like 9000.00) or already formatted (like 9.000)
    const parts = numStr.split(".");
    if (parts.length === 2 && parts[1].length <= 2 && parseFloat(parts[1]) === 0) {
      // It's like "9000.00" - treat as whole number
      integerPart = parts[0];
      decimalPart = "";
    } else {
      // It's already formatted like "9.000" or a real decimal
      integerPart = numStr.replace(/\./g, "");
      decimalPart = "";
    }
  } else {
    // Pure integer
    integerPart = numStr;
    decimalPart = "";
  }
  
  // Remove any existing dots from integer part
  integerPart = integerPart.replace(/\./g, "");
  
  // Add thousand separators to integer part only
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return with decimal part if exists
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
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
  // Allow only digits, one comma, and dots (we'll format the dots)
  let input = value.replace(/[^\d,]/g, "");
  
  // Handle multiple commas - only keep the first one
  const commaIndex = input.indexOf(',');
  if (commaIndex !== -1) {
    const beforeComma = input.substring(0, commaIndex);
    const afterComma = input.substring(commaIndex + 1).replace(/,/g, ''); // Remove additional commas
    input = beforeComma + ',' + afterComma;
  }
  
  // Apply formatting
  const formatted = formatNumberWithSeparator(input);
  onChange(formatted);
}

/**
 * Convert formatted string to raw number string for form submission
 */
export function getNumberValueForSubmission(formattedValue: string): string {
  if (!formattedValue) return "";
  
  // For incomplete input like "7," just return the formatted value as-is
  if (formattedValue.endsWith(',')) {
    return formattedValue;
  }
  
  const numericValue = parseFormattedNumber(formattedValue);
  return numericValue.toString();
}

/**
 * Format input value with Indonesian thousand separators for display in input fields
 */
export function formatNumberInput(value: string): string {
  if (!value) return "";
  
  // Remove all non-digit and non-comma characters
  let cleaned = value.replace(/[^\d,]/g, "");
  
  // Handle comma for decimals
  const commaIndex = cleaned.indexOf(',');
  if (commaIndex !== -1) {
    const integerPart = cleaned.substring(0, commaIndex);
    const decimalPart = cleaned.substring(commaIndex + 1).replace(/,/g, ''); // Remove additional commas
    cleaned = integerPart + (decimalPart ? ',' + decimalPart : '');
  }
  
  return formatNumberWithSeparator(cleaned);
}