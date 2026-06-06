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
