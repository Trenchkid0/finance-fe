import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import type { NetWorthPoint } from "./NetWorthHero";

interface Props {
  series: NetWorthPoint[];
  hoverPoint: NetWorthPoint | null;
  setHoverPoint: (p: NetWorthPoint | null) => void;
  lineColor: string;
  yDomain: [number, number];
  isId: boolean;
}

export const NetWorthHeroChart = React.memo(function NetWorthHeroChart({
  series,
  hoverPoint,
  setHoverPoint,
  lineColor,
  yDomain,
  isId,
}: Props) {
  if (series.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        {isId
          ? "Belum cukup data untuk periode ini."
          : "Not enough data for this period."}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={series}
        margin={{ top: 8, right: 16, left: 16, bottom: 4 }}
        onMouseLeave={() => setHoverPoint(null)}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.24} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
          opacity={0.3}
        />
        <YAxis hide domain={yDomain} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickFormatter={(d) => formatDateShort(d as string)}
          fontSize={10}
          stroke="var(--foreground)"
          opacity={0.5}
          interval="preserveStartEnd"
        />
        <Tooltip
          cursor={{
            stroke: "var(--accent)",
            strokeWidth: 1.5,
            strokeDasharray: "4 4",
            opacity: 0.3,
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as NetWorthPoint;
            if (hoverPoint?.date !== p.date)
              queueMicrotask(() => setHoverPoint(p));
            return (
              <div className="rounded-xl border border-border/40 bg-popover/85 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-xl shadow-black/50">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {formatDateShort(p.date)}
                </p>
                <p className="font-mono tabular-nums font-bold text-accent text-sm mt-0.5">
                  {formatIDR(p.value)}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2.5}
          fill="none"
          activeDot={{
            r: 5,
            stroke: "var(--card-bg)",
            strokeWidth: 2,
            fill: lineColor,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
