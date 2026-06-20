import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils/formatters";

const DOT_TOTAL = 28;

export function DotMatrix({
  count,
  value,
  dotColor,
}: {
  count: number;
  value: number;
  dotColor: string;
}) {
  // No data at all — hide entirely
  if (count <= 0 && value <= 0) return null;

  const filled = count > 0 ? Math.min(count, DOT_TOTAL) : DOT_TOTAL;
  const overflow = count > DOT_TOTAL ? count - DOT_TOTAL : 0;

  return (
    <div className="shrink-0 space-y-1" aria-label={`${count} transactions`}>
      <div className="grid grid-cols-4 gap-1 place-items-center">
        {Array.from({ length: DOT_TOTAL }).map((_, i) => (
          <span
            key={i}
            className={`block size-1.5 rounded-full aspect-square shrink-0 ${
              i < filled ? dotColor : "bg-border/30"
            }`}
          />
        ))}
      </div>
      {overflow > 0 && (
        <p className="text-[8px] text-muted-foreground/60 font-medium tabular-nums leading-none text-center">
          +{overflow}
        </p>
      )}
    </div>
  );
}

export function MiniStatWidget({
  label,
  value,
  tone,
  hint,
  isCurrency = true,
  count = 0,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "neutral";
  hint: string;
  isCurrency?: boolean;
  count?: number;
}) {
  const valueColor =
    tone === "income"
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : "text-foreground";
  const dotColor =
    tone === "income"
      ? "bg-income"
      : tone === "expense"
        ? "bg-expense"
        : "bg-accent";

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {label}
          </p>
          <p
            className={`text-2xl font-black font-mono tabular-nums truncate ${valueColor}`}
          >
            {isCurrency ? formatIDR(value) : value.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            {count > 0 && (
              <span className="font-semibold tabular-nums">{count} <span className="font-sans font-normal">tx</span></span>
            )}
            {hint && count > 0 && <span className="mx-1">·</span>}
            {hint}
          </p>
        </div>
        <DotMatrix count={count} value={value} dotColor={dotColor} />
      </div>
    </Card>
  );
}
