import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils/cn";

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
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // Local storage persistence for target goal input
  const [targetGoal, setTargetGoal] = useState<number>(() => {
    const saved = localStorage.getItem("net_worth_target_goal");
    return saved ? parseFloat(saved) : 1000000000; // Default 1 Billion IDR
  });

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

  // Compute daily stats and target calculations
  const stats = useMemo(() => {
    if (series.length < 2) return null;
    const values = series.map((p) => p.value);
    const peak = Math.max(...values);
    const trough = Math.min(...values);
    
    // Average daily growth
    let totalDiff = 0;
    for (let i = 1; i < series.length; i++) {
      totalDiff += series[i].value - series[i - 1].value;
    }
    const avgGrowth = totalDiff / (series.length - 1);
    
    return { peak, trough, avgGrowth };
  }, [series]);

  const percentAchieved = Math.min(100, Math.max(0, (current / (targetGoal || 1)) * 100));
  const daysToTarget = useMemo(() => {
    if (!stats || stats.avgGrowth <= 0 || current >= targetGoal) return 0;
    return Math.ceil((targetGoal - current) / stats.avgGrowth);
  }, [current, targetGoal, stats]);

  const handleTargetChange = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9]/g, "")) || 0;
    setTargetGoal(num);
    localStorage.setItem("net_worth_target_goal", num.toString());
  };

  const lineColor = "var(--accent)";
  const periodLabel = periodOptions.find((o) => o.value === period)?.label ?? "";

  return (
    <Card className="group relative overflow-hidden p-0 gap-0 border border-border/50 bg-card/60 dark:bg-elevated/10 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-accent/[0.01]" aria-label={isId ? "Grafik Total Kekayaan" : "Net Worth Chart"} role="region">
      {/* Sci-fi Corner Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent/20 rounded-tl transition-all duration-300 group-hover:border-accent/50 group-hover:w-4 group-hover:h-4" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent/20 rounded-tr transition-all duration-300 group-hover:border-accent/50 group-hover:w-4 group-hover:h-4" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent/20 rounded-bl transition-all duration-300 group-hover:border-accent/50 group-hover:w-4 group-hover:h-4" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent/20 rounded-br transition-all duration-300 group-hover:border-accent/50 group-hover:w-4 group-hover:h-4" />

      {/* Header controls: Net Worth Info + Tab Switch (Original sizes, theme-adaptive colors) */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 relative z-10">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-muted-foreground/80">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          <p className="text-3xl font-black font-mono tabular-nums text-foreground transition-all duration-300 group-hover:scale-105 group-hover:text-accent">
            {formatIDR(display.value)}
          </p>
          <DeltaLine dir={dir} delta={delta} ratio={ratio} hoveredLabel={display.label} periodLabel={periodLabel} isId={isId} />
        </div>

        {/* Original layout switch with theme-adaptive colors & high contrast text */}
        <div className="flex items-center bg-muted/40 dark:bg-black/25 border border-border/40 dark:border-white/[0.05] rounded-xl p-0.5 text-[9px] font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all duration-300",
              chartType === "line"
                ? "bg-accent text-white dark:text-slate-950 shadow-md shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isId ? "Garis" : "Line"}
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all duration-300",
              chartType === "bar"
                ? "bg-accent text-white dark:text-slate-950 shadow-md shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isId ? "Batang" : "Bar"}
          </button>
        </div>
      </div>

      <p className="px-5 pb-3 text-[11px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-muted-foreground/70 relative z-10">
        {isId 
          ? `Perubahan total kekayaan Anda selama ${periodLabel.toLowerCase()} terakhir.`
          : `Your net worth change over the last ${periodLabel.toLowerCase()}.`}
      </p>

      {/* Chart Canvas */}
      <div className="h-52 px-1 pt-1 pb-3 relative z-10" role="img" aria-label={isId ? `Tren total kekayaan selama ${periodLabel}` : `Net worth trend for ${periodLabel}`}>
        <Suspense fallback={<div className="h-full bg-elevated/30 animate-pulse rounded" />}>
          <NetWorthHeroChart
            series={series}
            hoverPoint={hoverPoint}
            setHoverPoint={setHoverPoint}
            lineColor={lineColor}
            yDomain={yDomain}
            isId={isId}
            chartType={chartType}
          />
        </Suspense>
      </div>

      {/* Stats Footer - Fully Theme Adaptive */}
      <div className="border-t border-border/40 dark:border-white/[0.04] bg-muted/20 dark:bg-black/10 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono relative z-10">
        {/* Metric 1: Average Growth */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold font-sans">
            {isId ? "Rerata Pertumbuhan" : "Avg Daily Growth"}
          </p>
          <p className={cn("text-sm font-bold tabular-nums", (stats?.avgGrowth ?? 0) >= 0 ? "text-income" : "text-expense")}>
            {(stats?.avgGrowth ?? 0) >= 0 ? "+" : ""}{formatIDR(stats?.avgGrowth ?? 0)}
          </p>
        </div>

        {/* Metric 2: Peak & Trough */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold font-sans">
            {isId ? "Puncak & Terendah" : "Peak / Trough"}
          </p>
          <p className="text-sm font-bold text-foreground tabular-nums flex flex-wrap items-center">
            <span className="text-income">{formatIDR(stats?.peak ?? 0)}</span>
            <span className="text-muted-foreground/30 mx-1">/</span>
            <span className="text-expense">{formatIDR(stats?.trough ?? 0)}</span>
          </p>
        </div>

        {/* Metric 3: Target Goal Input */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold font-sans">
            {isId ? "Target Sasaran" : "Target Goal"}
          </p>
          <div className="flex items-center gap-1.5 bg-background dark:bg-black/20 border border-border/50 dark:border-white/[0.05] rounded-lg px-2 py-0.5 max-w-[130px]">
            <span className="text-accent/60 text-[10px] font-bold">Rp</span>
            <input
              type="text"
              className="bg-transparent border-none outline-none font-bold text-foreground text-xs w-full tabular-nums"
              value={targetGoal.toLocaleString(isId ? "id-ID" : "en-US")}
              onChange={(e) => handleTargetChange(e.target.value)}
            />
          </div>
        </div>

        {/* Metric 4: Goal Achievement */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold font-sans">
            {isId ? "Estimasi Pencapaian" : "Target Achievement"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-accent tabular-nums">
              {percentAchieved.toFixed(1)}%
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[11px] text-muted-foreground font-semibold">
              {percentAchieved >= 100
                ? (isId ? "Selesai!" : "Reached!")
                : (stats && stats.avgGrowth > 0
                  ? (isId ? `~${daysToTarget} hari` : `~${daysToTarget}d left`)
                  : (isId ? "N/A" : "N/A"))}
            </span>
          </div>
        </div>
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
