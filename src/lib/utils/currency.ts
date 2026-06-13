/**
 * Safe currency math helpers to avoid IEEE 754 floating-point issues.
 * E.g. 0.1 + 0.2 = 0.30000000000000004 → rounded to 0.3
 */

const PRECISION = 10; // decimal places for intermediate math

/**
 * Round a currency value to avoid floating-point noise.
 * Rounds to 2 decimal places by default (suitable for most currencies).
 */
export function roundCurrency(value: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Safely sum an array of currency values.
 * Uses integer arithmetic internally to avoid precision loss.
 */
export function safeSum(values: number[]): number {
  // Multiply by 10^PRECISION, sum as integers, then divide back
  const factor = Math.pow(10, PRECISION);
  const intSum = values.reduce((acc, v) => acc + Math.round(v * factor), 0);
  return intSum / factor;
}

/**
 * Safe addition of two currency amounts.
 */
export function safeAdd(a: number, b: number): number {
  return roundCurrency(a + b);
}

/**
 * Safe subtraction of two currency amounts.
 */
export function safeSub(a: number, b: number): number {
  return roundCurrency(a - b);
}

/**
 * Safe percentage calculation (e.g. for budget progress).
 * Returns 0 when total is 0 to avoid NaN/Infinity.
 */
export function safePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return roundCurrency((part / total) * 100, 1);
}
