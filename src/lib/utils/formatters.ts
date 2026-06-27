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

export function formatDate(date: Date | string, language?: string): string {
  const locale = language === "en" ? "en-US" : "id-ID";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string, language?: string): string {
  const locale = language === "en" ? "en-US" : "id-ID";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatMonthLabel(date: Date | string, language?: string): string {
  const locale = language === "en" ? "en-US" : "id-ID";
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
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
  // Strip all non-digits except optional leading minus
  const isNegative = val.startsWith("-");
  const digits = val.replace(/\D/g, "");
  if (!digits) return isNegative ? "-" : "";

  const formatted = new Intl.NumberFormat("id-ID").format(Number(digits));
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format raw string input with dots as thousands separators and up to 2 decimal digits after a comma.
 * Used for real-time formatting in input fields that support decimal prices (like crypto or fractional units).
 */
export function formatInputRupiahDecimal(val: string): string {
  if (!val) return "";

  const isNegative = val.startsWith("-");
  
  // Clean all characters except digits, minus, and comma/dot
  let clean = val.replace(/[^-0-9.,]/g, "");

  let decimalSeparator = "";
  if (clean.includes(",")) {
    decimalSeparator = ",";
  } else if (clean.includes(".")) {
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount === 1) {
      const parts = clean.split(".");
      if (parts[1].length <= 2) {
        decimalSeparator = ".";
      }
    }
  }

  let integerPart = "";
  let decimalPart = "";

  if (decimalSeparator) {
    const parts = clean.split(decimalSeparator);
    integerPart = parts[0].replace(/\D/g, "");
    decimalPart = parts[1].replace(/\D/g, "").slice(0, 2); // limit to 2 decimal digits
  } else {
    integerPart = clean.replace(/\D/g, "");
  }

  if (!integerPart && !decimalPart) return isNegative ? "-" : "";

  let formattedInteger = "";
  if (integerPart) {
    formattedInteger = new Intl.NumberFormat("id-ID").format(Number(integerPart));
  } else if (isNegative) {
    formattedInteger = "0";
  }

  let result = isNegative ? `-${formattedInteger}` : formattedInteger;
  
  if (val.includes(",") || (decimalSeparator === "." && val.includes("."))) {
    result += "," + decimalPart;
  }

  return result;
}

/**
 * Parse localized Indonesian number format (dots as thousands, comma as decimal) back to JS float.
 */
export function parseLocalizedFloat(val: string): number {
  if (!val) return 0;
  // Remove all dots (thousands separators)
  let clean = val.replace(/\./g, "");
  // Replace comma with dot (decimal separator)
  clean = clean.replace(/,/g, ".");
  // Parse float
  return parseFloat(clean) || 0;
}

