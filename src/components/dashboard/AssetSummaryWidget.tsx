import type { CSSProperties } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils/formatters";
import type { AssetGroup } from "@/types";

export function AssetSummaryWidget({
  total,
  deltaRatio,
  groups,
  isId,
}: {
  total: number;
  deltaRatio: number;
  groups: AssetGroup[];
  isId: boolean;
}) {
  const up = deltaRatio >= 0;
  const badgeClass = up
    ? "text-income bg-income/10"
    : "text-expense bg-expense/10";
  return (
    <Card className="h-full p-6 flex flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          {deltaRatio !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}`}
            >
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {up ? "+" : ""}
              {deltaRatio.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-black font-mono tabular-nums text-foreground">
          {formatIDR(total)}
        </p>
      </div>

      <div className="flex flex-col gap-3.5 mt-auto">
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            {isId ? "Belum ada aset." : "No assets yet."}
          </p>
        ) : (
          groups.slice(0, 4).map((g) => {
            const dotStyle: CSSProperties = { backgroundColor: g.color };
            const barStyle: CSSProperties = {
              width: `${Math.max(g.percent, 2)}%`,
              backgroundColor: g.color,
            };
            return (
              <div key={g.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full" style={dotStyle} />
                    {g.name}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    {formatIDR(g.total)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={barStyle}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
