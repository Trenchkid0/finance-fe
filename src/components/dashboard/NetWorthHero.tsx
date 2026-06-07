"use client";
import { useMemo, useState, useTransition } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NetWorthPoint { date: string; value: number; }
export type NetWorthPeriod = "1d" | "7d" | "30d" | "90d" | "ytd" | "365d" | "5y";

interface Props {
  current: number;
  previous: number;
  period: NetWorthPeriod;
  series: NetWorthPoint[];
}

// PERUBAHAN: label yang JELAS untuk pengguna awam (dulu "30H" / "365H" / "5T")
const PERIOD_OPTIONS: { value: NetWorthPeriod; label: string }[] = [
  { value: "1d", label: "1 Hari" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "3 Bulan" },
  { value: "ytd", label: "Tahun Ini" },
  { value: "365d", label: "1 Tahun" },
  { value: "5y", label: "5 Tahun" },
];

export function NetWorthHero({ current, previous, period, series }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [hoverPoint, setHoverPoint] = useState<NetWorthPoint | null>(null);

  function setPeriod(next: NetWorthPeriod) {
    const params = new URLSearchParams(searchParams);
    if (next === "30d") params.delete("period");
    else params.set("period", next);
    const qs = params.toString();
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

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
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "";

  return (
    <section className="group rounded-2xl border border-border/40 bg-card/40 overflow-hidden hover:border-accent/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300" aria-label="Grafik Total Kekayaan" role="region">
      <div className="flex items-start justify-between gap-4 p-6 pb-1">
        <div className="space-y-2">
          {/* PERUBAHAN: "Net Worth" -> "Total Kekayaan" */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-muted-foreground/80">Total Kekayaan</p>
          <p className="text-3xl font-black font-mono tabular-nums text-foreground transition-all duration-300 group-hover:scale-105 group-hover:text-accent">
            {formatIDR(display.value)}
          </p>
          <DeltaLine dir={dir} delta={delta} ratio={ratio} hoveredLabel={display.label} periodLabel={periodLabel} />
        </div>
        <div className="shrink-0">
          <PeriodSelect value={period} onChange={setPeriod} disabled={pending} />
        </div>
      </div>

      {/* PERUBAHAN: 1 kalimat penjelas grafik */}
      <p className="px-6 pb-2 text-[11px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-muted-foreground/70">
        Perubahan total kekayaan Anda selama {periodLabel.toLowerCase()} terakhir.
      </p>

      <div className="h-52 px-1 pt-1 pb-3" role="img" aria-label={`Tren total kekayaan selama ${periodLabel}`}>
        {series.length < 2 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Belum cukup data untuk periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={ { top: 8, right: 16, left: 16, bottom: 4 } }
              onMouseLeave={() => setHoverPoint(null)} accessibilityLayer>
              <defs>
                <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
              <YAxis hide domain={yDomain} />
              <XAxis dataKey="date" tickLine={false} axisLine={false}
                tickFormatter={(d) => formatDateShort(d as string)}
                fontSize={10} stroke="var(--foreground)" opacity={0.5} interval="preserveStartEnd" />
              {/* PERUBAHAN: tooltip kini TERLIHAT — tanggal + rupiah penuh */}
              <Tooltip
                cursor={ { stroke: "var(--accent)", strokeWidth: 1.5, strokeDasharray: "4 4", opacity: 0.3 } }
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as NetWorthPoint;
                  if (hoverPoint?.date !== p.date) queueMicrotask(() => setHoverPoint(p));
                  return (
                    <div className="rounded-xl border border-border/40 bg-popover/85 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-xl shadow-black/50">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{formatDateShort(p.date)}</p>
                      <p className="font-mono tabular-nums font-bold text-accent text-sm mt-0.5">{formatIDR(p.value)}</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2.5} fill="url(#netWorthFill)" activeDot={{ r: 5, stroke: "var(--card-bg)", strokeWidth: 2, fill: lineColor }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function DeltaLine({ dir, delta, ratio, hoveredLabel, periodLabel }: {
  dir: "up" | "down" | "flat"; delta: number; ratio: number;
  hoveredLabel: string | null; periodLabel: string;
}) {
  const colorClass = dir === "up" ? "text-income" : dir === "down" ? "text-expense" : "text-muted-foreground";
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
  return (
    <p className={`text-sm font-mono tabular-nums ${colorClass}`}>
      {delta >= 0 ? "+" : ""}{formatIDR(delta)}
      <span className="ml-2 inline-flex items-center gap-0.5">
        <Icon size={12} /> {Math.abs(ratio).toFixed(1)}%
      </span>
      {/* PERUBAHAN: konteks lebih jelas */}
      <span className="ml-2 text-muted-foreground font-sans">
        {hoveredLabel ? `pada ${hoveredLabel}` : `dibanding ${periodLabel.toLowerCase()} lalu`}
      </span>
    </p>
  );
}

function PeriodSelect({ value, onChange, disabled }: {
  value: NetWorthPeriod; onChange: (v: NetWorthPeriod) => void; disabled?: boolean;
}) {
  const selectedLabel = PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-white/[0.04] bg-white/[0.03] border border-white/[0.08] transition-all"
        >
          <span>{selectedLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
        {PERIOD_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            className="text-xs font-semibold cursor-pointer"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}