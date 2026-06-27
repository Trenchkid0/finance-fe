import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";

// Lazy-load Recharts (~170KB gzipped) — only fetched when chart is visible
const NetWorthHeroChart = lazy(() =>
  import("./NetWorthHeroChart").then((m) => ({ default: m.NetWorthHeroChart }))
);

export interface NetWorthPoint { date: string; value: number; }
export type NetWorthPeriod = "1d" | "7d" | "30d" | "90d" | "ytd" | "365d" | "5y";

interface Props {
  current: number;
  previous: number;
  period: NetWorthPeriod;
  series: NetWorthPoint[];
}

const getPeriodOptions = (isId: boolean): { value: NetWorthPeriod; label: string }[] => [
  { value: "1d", label: isId ? "1 Hari" : "1 Day" },
  { value: "7d", label: isId ? "7 Hari" : "7 Days" },
  { value: "30d", label: isId ? "30 Hari" : "30 Days" },
  { value: "90d", label: isId ? "3 Bulan" : "3 Months" },
  { value: "ytd", label: isId ? "Tahun Ini" : "YTD" },
  { value: "365d", label: isId ? "1 Tahun" : "1 Year" },
  { value: "5y", label: isId ? "5 Tahun" : "5 Years" },
];

export function NetWorthHero({ current, previous, period, series }: Props) {
  const [hoverPoint, setHoverPoint] = useState<NetWorthPoint | null>(null);
  const { language } = useLanguage();
  const isId = language === "id";

  const periodOptions = getPeriodOptions(isId);

  const delta = current - previous;
  const ratio = previous === 0 ? 0 : (delta / previous) * 100;
  const dir: "up" | "down" | "flat" = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const display = hoverPoint
    ? { value: hoverPoint.value, label: formatDateShort(hoverPoint.date) }
    : { value: current, label: null };

  const yDomain = useMemo<[number, number]>(() => {
    if (series.length === 0) return [0, 1];
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.05 || max * 0.02;
    return [min - pad, max + pad];
  }, [series]);

  const lineColor = "var(--accent)";
  const periodLabel = periodOptions.find((o) => o.value === period)?.label ?? "";

  return (
    <Card className="group overflow-hidden p-0 gap-0" aria-label={isId ? "Grafik Total Kekayaan" : "Net Worth Chart"} role="region">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-muted-foreground/80">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          <p className="text-3xl font-black font-mono tabular-nums text-foreground transition-all duration-300 group-hover:scale-105 group-hover:text-accent">
            {formatIDR(display.value)}
          </p>
          <DeltaLine dir={dir} delta={delta} ratio={ratio} hoveredLabel={display.label} periodLabel={periodLabel} isId={isId} />
        </div>
      </div>

      <p className="px-5 pb-3 text-[11px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-muted-foreground/70">
        {isId 
          ? `Perubahan total kekayaan Anda selama ${periodLabel.toLowerCase()} terakhir.`
          : `Your net worth change over the last ${periodLabel.toLowerCase()}.`}
      </p>

      <div className="h-52 px-1 pt-1 pb-3" role="img" aria-label={isId ? `Tren total kekayaan selama ${periodLabel}` : `Net worth trend for ${periodLabel}`}>
        <Suspense fallback={<div className="h-full bg-elevated/30 animate-pulse rounded" />}>
          <NetWorthHeroChart
            series={series}
            hoverPoint={hoverPoint}
            setHoverPoint={setHoverPoint}
            lineColor={lineColor}
            yDomain={yDomain}
            isId={isId}
          />
        </Suspense>
      </div>
    </Card>
  );
}

function DeltaLine({ dir, delta, ratio, hoveredLabel, periodLabel, isId }: {
  dir: "up" | "down" | "flat"; delta: number; ratio: number;
  hoveredLabel: string | null; periodLabel: string; isId: boolean;
}) {
  const colorClass = dir === "up" ? "text-income" : dir === "down" ? "text-expense" : "text-muted-foreground";
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
  return (
    <p className={`text-sm font-mono tabular-nums ${colorClass}`}>
      {delta >= 0 ? "+" : ""}{formatIDR(delta)}
      <span className="ml-2 inline-flex items-center gap-0.5">
        <Icon size={12} /> {Math.abs(ratio).toFixed(1)}%
      </span>
      <span className="ml-2 text-muted-foreground font-sans">
        {hoveredLabel 
          ? (isId ? `pada ${hoveredLabel}` : `on ${hoveredLabel}`) 
          : (isId ? `dibanding ${periodLabel.toLowerCase()} lalu` : `vs last ${periodLabel.toLowerCase()}`)}
      </span>
    </p>
  );
}
