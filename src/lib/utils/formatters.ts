const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface FormatIDROptions {
  compact?: boolean;
  signed?: boolean;
}

export function formatIDR(amount: number, options: FormatIDROptions = {}): string {
  const { compact, signed } = options;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : signed ? "+" : "";

  if (compact) {
    if (abs >= 1_000_000_000) {
      return `${sign}Rp ${formatCompactNumber(abs / 1_000_000_000)} M`;
    }
    if (abs >= 1_000_000) {
      return `${sign}Rp ${formatCompactNumber(abs / 1_000_000)} jt`;
    }
    if (abs >= 1_000) {
      return `${sign}Rp ${formatCompactNumber(abs / 1_000)} rb`;
    }
  }

  const formatted = IDR.format(abs);
  return `${sign}${formatted}`;
}

function formatCompactNumber(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export function formatPercent(ratio: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatMonthLabel(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(date),
  );
}

/**
 * Clean money input string by removing currency prefix, thousands separators, and decimal cents.
 * Handles both Indonesian (dots for thousands, commas for cents) and standard formats.
 */
export function cleanMoneyString(val: string): string {
  // Strip "Rp", "rp", spaces, and dashes
  let clean = val.replace(/Rp/gi, "").replace(/\s+/g, "").trim();

  // If there's a comma/dot followed by exactly two digits at the end (cents), strip it
  clean = clean.replace(/[,.]\d{2}$/, "");

  // Now strip all remaining dots and commas
  clean = clean.replace(/[.,]/g, "");

  return clean || "0";
}

/**
 * Format raw string input with dots as thousands separators.
 * Used for real-time formatting in input fields.
 */
export function formatInputRupiah(val: string): string {
  // Strip all non-digits
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";

  return new Intl.NumberFormat("id-ID").format(Number(digits));
}
