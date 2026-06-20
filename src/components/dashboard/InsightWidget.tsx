import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function InsightWidget({
  ratio,
  surplus,
  isId,
}: {
  ratio: number;
  surplus: number;
  isId: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ratio));
  const positive = surplus >= 0;
  const progressStyle: CSSProperties = {
    width: `${pct}%`,
    backgroundColor: "var(--accent)",
  };
  return (
    <Card className="relative overflow-hidden p-5 flex flex-col justify-between">
      <div className="relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent">
        <Sparkles size={13} />
        {isId ? "Wawasan" : "Insights"}
      </div>
      <div className="relative mt-2">
        <p className="text-3xl font-black font-mono tabular-nums text-foreground">
          {pct.toFixed(0)}%
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">
          {positive
            ? isId
              ? `Anda menabung ${pct.toFixed(0)}% dari pemasukan periode ini.`
              : `You saved ${pct.toFixed(0)}% of income this period.`
            : isId
              ? "Pengeluaran melebihi pemasukan periode ini."
              : "Spending exceeded income this period."}
        </p>
      </div>
      <div className="relative mt-3 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={progressStyle}
        />
      </div>
    </Card>
  );
}
