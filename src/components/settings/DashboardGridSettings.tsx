import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LayoutGrid,
  BarChart3,
  Grid3x3,
  Layers,
  Check,
  Eye,
  Maximize2,
  X,
  Clock,
  ChevronDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  getCurrentPreferences,
  savePreferences,
  type DashboardLayout,
} from "@/lib/preferences";

interface LayoutOption {
  id: DashboardLayout;
  icon: React.ReactNode;
  label: { id: string; en: string };
  desc: { id: string; en: string };
  features: { id: string[]; en: string[] };
}

const LAYOUTS: LayoutOption[] = [
  {
    id: "default",
    icon: <LayoutGrid size={16} />,
    label: { id: "Default", en: "Default" },
    desc: {
      id: "Tata letak seimbang — hero chart di kiri, ringkasan aset di kanan, diikuti statistik dan grafik analisis.",
      en: "Balanced layout — hero chart on the left, asset summary on the right, followed by stats and analysis charts.",
    },
    features: {
      id: ["Hero chart 2/3 + Ringkasan aset 1/3", "4 kartu statistik dalam satu baris", "Grafik tab & transaksi berurutan"],
      en: ["Hero chart 2/3 + Asset summary 1/3", "4 stat cards in one row", "Tabbed charts & transactions stacked"],
    },
  },
  {
    id: "analytics",
    icon: <BarChart3 size={16} />,
    label: { id: "Analytics", en: "Analytics" },
    desc: {
      id: "Fokus pada analisis arus kas — Sankey chart full-width di paling atas, diikuti hero dan neraca berdampingan.",
      en: "Cash flow analysis focus — full-width Sankey chart at the top, followed by hero and side-by-side balance sheet.",
    },
    features: {
      id: ["Sankey chart full-width di atas", "3 statistik kunci (fokus arus kas)", "Transaksi & neraca berdampingan 50/50"],
      en: ["Full-width Sankey chart on top", "3 key stats (cashflow focused)", "Transactions & balance sheet side-by-side 50/50"],
    },
  },
  {
    id: "compact",
    icon: <Grid3x3 size={16} />,
    label: { id: "Compact", en: "Compact" },
    desc: {
      id: "Grid padat — hero dan ringkasan berdampingan 50/50, semua info terlihat dalam satu layar tanpa banyak scroll.",
      en: "Dense grid — hero and summary side-by-side 50/50, all info visible in one screen without much scrolling.",
    },
    features: {
      id: ["Hero + ringkasan 50/50 seimbang", "4 kartu statistik compact", "Grafik tab di atas, transaksi di bawah"],
      en: ["Hero + summary 50/50 balanced", "4 compact stat cards", "Tabbed charts above, transactions below"],
    },
  },
  {
    id: "hero",
    icon: <Layers size={16} />,
    label: { id: "Hero Focus", en: "Hero Focus" },
    desc: {
      id: "Grafik total kekayaan mendominasi — chart full-width lebih tinggi untuk melihat tren dengan sangat jelas.",
      en: "Net worth chart dominates — taller full-width chart area for clearer trend visualization.",
    },
    features: {
      id: ["Chart full-width lebih tinggi (h-72)", "Ringkasan aset + statistik grid 2×2", "Grafik analisis & transaksi di bawah"],
      en: ["Taller full-width chart (h-72)", "Asset summary + 2×2 stat grid", "Analysis charts & transactions below"],
    },
  },
];

/** Mini visual wireframe inside layout card */
function LayoutMiniWireframe({ layout }: { layout: LayoutOption }) {
  const hero = "bg-accent/30 border border-accent/25 rounded";
  const summary = "bg-muted/50 border border-border/40 rounded";
  const stat = "bg-income/20 border border-income/20 rounded";
  const chart = "bg-warning/20 border border-warning/20 rounded";
  const tx = "bg-expense/15 border border-expense/15 rounded";
  const balance = "bg-purple-500/15 border border-purple-500/20 rounded";

  if (layout.id === "default") {
    return (
      <div className="space-y-1 w-full">
        <div className="flex gap-1">
          <div className={cn(hero, "flex-[2] h-6")} />
          <div className={cn(summary, "flex-1 h-6")} />
        </div>
        <div className="flex gap-1">
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
        </div>
        <div className={cn(chart, "h-4 w-full")} />
        <div className={cn(tx, "h-4 w-full")} />
      </div>
    );
  }

  if (layout.id === "analytics") {
    return (
      <div className="space-y-1 w-full">
        <div className={cn(chart, "h-5 w-full")} />
        <div className="flex gap-1">
          <div className={cn(hero, "flex-[2] h-5")} />
          <div className={cn(summary, "flex-1 h-5")} />
        </div>
        <div className="flex gap-1">
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
        </div>
        <div className="flex gap-1">
          <div className={cn(tx, "flex-1 h-4")} />
          <div className={cn(balance, "flex-1 h-4")} />
        </div>
      </div>
    );
  }

  if (layout.id === "compact") {
    return (
      <div className="space-y-1 w-full">
        <div className="flex gap-1">
          <div className={cn(hero, "flex-1 h-5.5")} />
          <div className={cn(summary, "flex-1 h-5.5")} />
        </div>
        <div className="flex gap-1">
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
          <div className={cn(stat, "flex-1 h-2.5")} />
        </div>
        <div className={cn(chart, "h-4 w-full")} />
        <div className={cn(tx, "h-4 w-full")} />
      </div>
    );
  }

  // hero
  return (
    <div className="space-y-1 w-full">
      <div className={cn(hero, "h-7 w-full")} />
      <div className="flex gap-1">
        <div className={cn(summary, "flex-1 h-5")} />
        <div className="flex-1 grid grid-cols-2 gap-0.5">
          <div className={cn(stat, "h-2.5")} />
          <div className={cn(stat, "h-2.5")} />
          <div className={cn(stat, "h-2.5")} />
          <div className={cn(stat, "h-2.5")} />
        </div>
      </div>
      <div className={cn(chart, "h-4 w-full")} />
      <div className={cn(tx, "h-4 w-full")} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Exact UI Components Matching Dashboard.tsx & Child Widgets
────────────────────────────────────────────────────────────── */

function MockDashboardHeader({ isId }: { isId: boolean }) {
  return (
    <div className="flex items-center justify-between pb-1 border-b border-border/30">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} className="text-accent" />
          <span>{isId ? "Selamat malam" : "Good evening"}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-border" />
        <h3 className="text-sm font-semibold text-foreground">User</h3>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-elevated/60 text-[10px] font-semibold text-foreground">
        <span>{isId ? "30 Hari" : "30 Days"}</span>
        <ChevronDown size={11} className="text-muted-foreground" />
      </div>
    </div>
  );
}

function MockNetWorthHero({ tall = false, isId }: { tall?: boolean; isId: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background text-card-foreground flex flex-col justify-between overflow-hidden shadow-xs transition-all relative group",
        tall ? "h-64 sm:h-72" : "h-48 sm:h-52"
      )}
    >
      {/* Corner marks */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-border/60 rounded-tl pointer-events-none" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-border/60 rounded-tr pointer-events-none" />

      {/* Header controls: Net Worth Info + Tab Switch */}
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3.5 pb-1 relative z-10">
        <div className="space-y-0.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-foreground tracking-tight">
              Rp 150.250.000
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-income bg-income/10 border border-income/20">
              <TrendingUp size={10} />
              +12.4%
            </span>
          </div>
          <p className="text-[8px] text-muted-foreground/60 hidden sm:block">
            {isId ? "Perubahan total kekayaan Anda selama 30 hari terakhir." : "Net worth change over the last 30 days."}
          </p>
        </div>

        {/* Toggle switch: Garis / Batang */}
        <div className="flex items-center bg-muted/40 border border-border/40 rounded-lg p-0.5 text-[8px] font-bold uppercase tracking-wider shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-accent text-white shadow-xs">
            {isId ? "Garis" : "Line"}
          </span>
          <span className="px-2 py-0.5 rounded-md text-muted-foreground">
            {isId ? "Batang" : "Bar"}
          </span>
        </div>
      </div>

      {/* SVG Net Worth Trend Line & Area */}
      <div className="relative w-full flex-1 px-1 min-h-0">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mock-hero-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="20" x2="320" y2="20" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2="320" y2="50" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
          <path
            d="M 0 65 Q 40 60, 80 48 T 160 38 T 240 22 T 320 12 L 320 80 L 0 80 Z"
            fill="url(#mock-hero-gradient)"
          />
          <path
            d="M 0 65 Q 40 60, 80 48 T 160 38 T 240 22 T 320 12"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Peak dot */}
          <circle cx="320" cy="12" r="3.5" fill="var(--accent)" stroke="var(--background)" strokeWidth="2" />
        </svg>
      </div>

      {/* Stats Footer (4 Metrics) */}
      <div className="border-t border-border/40 bg-muted/20 px-3.5 py-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono relative z-10 shrink-0">
        <div>
          <p className="text-[7.5px] uppercase tracking-wider text-muted-foreground/60 font-sans font-semibold">
            {isId ? "Rerata Pertumbuhan" : "Avg Daily Growth"}
          </p>
          <p className="font-bold text-income tabular-nums mt-0.5">+Rp 450.000</p>
        </div>
        <div>
          <p className="text-[7.5px] uppercase tracking-wider text-muted-foreground/60 font-sans font-semibold">
            {isId ? "Titik Tertinggi" : "Peak"}
          </p>
          <p className="font-bold text-foreground tabular-nums mt-0.5">Rp 155.000.000</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-[7.5px] uppercase tracking-wider text-muted-foreground/60 font-sans font-semibold">
            {isId ? "Titik Terendah" : "Trough"}
          </p>
          <p className="font-bold text-foreground tabular-nums mt-0.5">Rp 132.000.000</p>
        </div>
        <div>
          <p className="text-[7.5px] uppercase tracking-wider text-muted-foreground/60 font-sans font-semibold">
            {isId ? "Target 1 M" : "Goal 1B"}
          </p>
          <p className="font-bold text-accent tabular-nums mt-0.5">15.0%</p>
        </div>
      </div>
    </div>
  );
}

function MockAssetSummaryWidget({ isId }: { isId: boolean }) {
  const groups = [
    { name: isId ? "Kas & Bank" : "Cash & Bank", amount: "Rp 45.000.000", pct: 30, color: "var(--accent)" },
    { name: isId ? "Saham & Investasi" : "Stocks & Funds", amount: "Rp 75.000.000", pct: 50, color: "var(--income)" },
    { name: isId ? "Properti & Fisik" : "Real Estate & Other", amount: "Rp 30.250.000", pct: 20, color: "#A855F7" },
  ];

  return (
    <div className="h-full p-4 rounded-xl border border-border bg-background text-card-foreground flex flex-col justify-between shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-income bg-income/10 border border-income/20">
            <TrendingUp size={10} />
            +12.4%
          </span>
        </div>
        <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-foreground">
          Rp 150.250.000
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        {groups.map((g) => (
          <div key={g.name} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name}
              </span>
              <span className="font-mono tabular-nums font-semibold text-foreground">
                {g.amount}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${g.pct}%`, backgroundColor: g.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockDotMatrix({ count, dotColor }: { count: number; dotColor: string }) {
  return (
    <div className="shrink-0 space-y-0.5">
      <div className="grid grid-cols-4 gap-0.5 place-items-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "block size-1 rounded-full aspect-square shrink-0",
              i < count ? dotColor : "bg-border/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MockMiniStatWidget({
  label,
  value,
  tone,
  count,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "neutral";
  count: number;
}) {
  const valueColor =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  const dotColor =
    tone === "income" ? "bg-income" : tone === "expense" ? "bg-expense" : "bg-accent";

  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 truncate">
            {label}
          </p>
          <p className={cn("text-base sm:text-lg font-black font-mono tabular-nums truncate", valueColor)}>
            {value}
          </p>
          <p className="text-[9px] text-muted-foreground/50 truncate">
            <span className="font-semibold tabular-nums">{count} tx</span> · total
          </p>
        </div>
        <MockDotMatrix count={count > 16 ? 16 : count} dotColor={dotColor} />
      </div>
    </div>
  );
}

function MockInsightWidget({ isId }: { isId: boolean }) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-accent truncate">
        <Sparkles size={11} className="shrink-0" />
        <span className="truncate">{isId ? "Wawasan" : "Insights"}</span>
      </div>
      <div className="mt-1">
        <p className="text-base sm:text-lg font-black font-mono tabular-nums text-foreground">
          52%
        </p>
        <p className="text-[8.5px] text-muted-foreground/70 leading-snug line-clamp-1 mt-0.5">
          {isId ? "Anda menabung 52% dari pemasukan periode ini." : "You saved 52% of income this period."}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: "52%" }} />
      </div>
    </div>
  );
}

function MockCashflowSankey({ isId }: { isId: boolean }) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs space-y-2 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            {isId ? "Analisis Arus Kas (Sankey Flow)" : "Cash Flow Analysis (Sankey Flow)"}
          </span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold">
            {isId ? "Bulan Ini" : "This Month"}
          </span>
        </div>
        <span className="text-[9px] font-mono text-income font-bold">+Rp 13.300.000 {isId ? "Surplus" : "Surplus"}</span>
      </div>

      <div className="relative h-20 w-full rounded-lg bg-elevated/40 border border-border/40 p-2 flex items-center justify-between overflow-hidden">
        {/* Left Side: Sources */}
        <div className="flex flex-col justify-between h-full z-10 w-24 text-[8px]">
          <div className="px-1.5 py-0.5 rounded bg-income/15 border border-income/30 flex justify-between">
            <span className="font-semibold text-income">{isId ? "Gaji" : "Salary"}</span>
            <span className="font-mono text-foreground">22.0M</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 flex justify-between">
            <span className="font-semibold text-teal-500">{isId ? "Bisnis" : "Biz"}</span>
            <span className="font-mono text-foreground">3.4M</span>
          </div>
        </div>

        {/* Center Node */}
        <div className="px-2 py-1 rounded bg-accent/20 border border-accent/40 text-center z-10">
          <div className="text-[7.5px] text-muted-foreground uppercase">{isId ? "Kas Masuk" : "Total Cash"}</div>
          <div className="text-[10px] font-bold font-mono text-accent">25.4M</div>
        </div>

        {/* Right Side: Destinations */}
        <div className="flex flex-col justify-between h-full z-10 w-24 text-[8px]">
          <div className="px-1.5 py-0.5 rounded bg-expense/15 border border-expense/30 flex justify-between">
            <span className="font-semibold text-expense">{isId ? "Biaya" : "Living"}</span>
            <span className="font-mono text-foreground">12.1M</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 flex justify-between">
            <span className="font-semibold text-purple-500">{isId ? "Tabungan" : "Invest"}</span>
            <span className="font-mono text-foreground">13.3M</span>
          </div>
        </div>

        {/* SVG Flow Connecting Ribbons */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 80">
          <path d="M 95 18 C 145 18, 150 40, 200 40 C 250 40, 255 18, 305 18" fill="none" stroke="rgba(46, 160, 67, 0.3)" strokeWidth="12" />
          <path d="M 95 62 C 145 62, 150 40, 200 40 C 250 40, 255 62, 305 62" fill="none" stroke="rgba(163, 113, 247, 0.3)" strokeWidth="12" />
        </svg>
      </div>
    </div>
  );
}

function MockTabbedCharts({ isId }: { isId: boolean }) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs">
      <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2">
        <div className="flex gap-2 text-[10px]">
          <span className="font-semibold text-foreground border-b-2 border-accent pb-1">
            {isId ? "Analisis Arus Kas" : "Cash Flow Analysis"}
          </span>
          <span className="font-semibold text-muted-foreground hover:text-foreground pb-1">
            {isId ? "Distribusi Aset" : "Asset Distribution"}
          </span>
        </div>
        <span className="text-[8px] text-muted-foreground font-mono">6 {isId ? "Bulan" : "Months"}</span>
      </div>
      <div className="h-16 flex items-end gap-2 pt-1 px-1 border-b border-border/30">
        {[
          { m: "Jan", inH: "55%", exH: "35%" },
          { m: "Feb", inH: "70%", exH: "40%" },
          { m: "Mar", inH: "60%", exH: "30%" },
          { m: "Apr", inH: "80%", exH: "45%" },
          { m: "Mei", inH: "90%", exH: "40%" },
          { m: "Jun", inH: "100%", exH: "45%" },
        ].map((item) => (
          <div key={item.m} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end justify-center gap-0.5 h-12">
              <div className="w-2.5 bg-income/85 rounded-t-xs" style={{ height: item.inH }} />
              <div className="w-2.5 bg-expense/85 rounded-t-xs" style={{ height: item.exH }} />
            </div>
            <span className="text-[7.5px] text-muted-foreground">{item.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockRecentTransactions({ isId }: { isId: boolean }) {
  const txs = [
    { title: isId ? "Gaji Bulanan" : "Monthly Salary", cat: isId ? "Pekerjaan" : "Income", amt: "+Rp 25.000.000", pos: true },
    { title: isId ? "Supermarket & Belanja" : "Groceries", cat: isId ? "Kebutuhan" : "Expense", amt: "-Rp 1.850.000", pos: false },
    { title: isId ? "Investasi Reksa Dana" : "Mutual Funds", cat: isId ? "Investasi" : "Transfer", amt: "-Rp 5.000.000", pos: false },
  ];

  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-pink-500" />
          <h4 className="text-[10px] font-bold text-foreground">
            {isId ? "Transaksi Terbaru" : "Recent Transactions"}
          </h4>
        </div>
        <span className="flex items-center gap-0.5 text-[8.5px] font-semibold text-accent hover:underline cursor-pointer">
          {isId ? "Lihat Semua" : "View All"}
          <ArrowRight size={10} />
        </span>
      </div>
      <div className="space-y-1.5">
        {txs.map((t, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-elevated/40 border border-border/30 text-[10px]"
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-5 rounded-full flex items-center justify-center font-bold text-[9px]",
                  t.pos ? "bg-income/20 text-income" : "bg-expense/20 text-expense"
                )}
              >
                {t.pos ? "+" : "-"}
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight text-[9.5px]">{t.title}</p>
                <span className="text-[7.5px] text-muted-foreground">{t.cat}</span>
              </div>
            </div>
            <span className={cn("font-mono font-bold text-[9.5px]", t.pos ? "text-income" : "text-foreground")}>
              {t.amt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockBalanceSheet({ isId }: { isId: boolean }) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-background text-card-foreground shadow-xs space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-foreground">
          {isId ? "Neraca Keuangan" : "Balance Sheet"}
        </span>
        <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-income/10 text-income font-semibold border border-income/20">
          {isId ? "Bebas Utang" : "Debt Free"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2 rounded-lg bg-elevated/40 border border-border/30">
          <span className="text-muted-foreground text-[8px]">{isId ? "Aset Lancar" : "Liquid Assets"}</span>
          <p className="font-mono font-bold text-foreground mt-0.5">Rp 45.000.000</p>
        </div>
        <div className="p-2 rounded-lg bg-elevated/40 border border-border/30">
          <span className="text-muted-foreground text-[8px]">{isId ? "Investasi Modal" : "Investments"}</span>
          <p className="font-mono font-bold text-foreground mt-0.5">Rp 75.250.000</p>
        </div>
      </div>
    </div>
  );
}

function LiveDashboardHomeMockup({ layoutId, isId }: { layoutId: DashboardLayout; isId: boolean }) {
  return (
    <div className="space-y-3">
      {/* Real Dashboard Top Header (Greeting + Period Select) */}
      <MockDashboardHeader isId={isId} />

      {/* Layout: DEFAULT */}
      {layoutId === "default" && (
        <>
          {/* Row 1: Hero (2/3) + Asset Summary (1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <MockNetWorthHero isId={isId} />
            </div>
            <div className="md:col-span-1">
              <MockAssetSummaryWidget isId={isId} />
            </div>
          </div>

          {/* Row 2: 4 stats in 1 row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MockMiniStatWidget label={isId ? "Pemasukan" : "Income"} value="Rp 25.400.000" tone="income" count={18} />
            <MockMiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value="Rp 12.100.000" tone="expense" count={24} />
            <MockMiniStatWidget label={isId ? "Transaksi" : "Transactions"} value="42" tone="neutral" count={42} />
            <MockInsightWidget isId={isId} />
          </div>

          {/* Row 3: Tabbed charts */}
          <MockTabbedCharts isId={isId} />

          {/* Row 4: Recent Transactions */}
          <MockRecentTransactions isId={isId} />
        </>
      )}

      {/* Layout: ANALYTICS */}
      {layoutId === "analytics" && (
        <>
          {/* Row 1: Full-width Sankey Flow */}
          <MockCashflowSankey isId={isId} />

          {/* Row 2: Hero (2/3) + Asset Summary (1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <MockNetWorthHero isId={isId} />
            </div>
            <div className="md:col-span-1">
              <MockAssetSummaryWidget isId={isId} />
            </div>
          </div>

          {/* Row 3: 3 key stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <MockMiniStatWidget label={isId ? "Pemasukan" : "Income"} value="Rp 25.400.000" tone="income" count={18} />
            <MockMiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value="Rp 12.100.000" tone="expense" count={24} />
            <MockInsightWidget isId={isId} />
          </div>

          {/* Row 4: 2 columns (Recent Transactions + Balance Sheet) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MockRecentTransactions isId={isId} />
            <MockBalanceSheet isId={isId} />
          </div>
        </>
      )}

      {/* Layout: COMPACT */}
      {layoutId === "compact" && (
        <>
          {/* Row 1: 50/50 Hero and Asset Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MockNetWorthHero isId={isId} />
            <MockAssetSummaryWidget isId={isId} />
          </div>

          {/* Row 2: 4 compact stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MockMiniStatWidget label={isId ? "Pemasukan" : "Income"} value="Rp 25.400.000" tone="income" count={18} />
            <MockMiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value="Rp 12.100.000" tone="expense" count={24} />
            <MockMiniStatWidget label={isId ? "Transaksi" : "Transactions"} value="42" tone="neutral" count={42} />
            <MockInsightWidget isId={isId} />
          </div>

          {/* Row 3: Tabbed charts */}
          <MockTabbedCharts isId={isId} />

          {/* Row 4: Recent Transactions */}
          <MockRecentTransactions isId={isId} />
        </>
      )}

      {/* Layout: HERO FOCUS */}
      {layoutId === "hero" && (
        <>
          {/* Row 1: Taller Full-Width Net Worth Hero */}
          <MockNetWorthHero tall isId={isId} />

          {/* Row 2: 2 columns: Asset Summary (left) + 2x2 grid of 4 stats (right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MockAssetSummaryWidget isId={isId} />
            <div className="grid grid-cols-2 gap-2">
              <MockMiniStatWidget label={isId ? "Pemasukan" : "Income"} value="Rp 25.400.000" tone="income" count={18} />
              <MockMiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value="Rp 12.100.000" tone="expense" count={24} />
              <MockMiniStatWidget label={isId ? "Transaksi" : "Transactions"} value="42" tone="neutral" count={42} />
              <MockInsightWidget isId={isId} />
            </div>
          </div>

          {/* Row 3: Tabbed charts */}
          <MockTabbedCharts isId={isId} />

          {/* Row 4: Recent Transactions */}
          <MockRecentTransactions isId={isId} />
        </>
      )}
    </div>
  );
}

export function DashboardGridSettings() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [selected, setSelected] = useState<DashboardLayout>(
    getCurrentPreferences().dashboardLayout || "default"
  );
  const [hovered, setHovered] = useState<DashboardLayout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key and prevent background scroll while modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  // When hovering, preview follows hovered; otherwise falls back to selected
  const activeLayout = hovered || selected;
  const activeLayoutConfig =
    LAYOUTS.find((l) => l.id === activeLayout) || LAYOUTS[0];

  const handleSelect = (layout: DashboardLayout) => {
    setSelected(layout);
    const prefs = getCurrentPreferences();
    savePreferences({ ...prefs, dashboardLayout: layout });
    const target = LAYOUTS.find((l) => l.id === layout);
    if (target) {
      toast.success(
        isId
          ? `Tata letak berhasil diubah ke: ${target.label.id}`
          : `Layout successfully switched to: ${target.label.en}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <LayoutGrid size={14} className="text-accent" />
          {isId ? "Tata Letak Dashboard" : "Dashboard Layout"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {isId
            ? "Arahkan kursor (hover) pada salah satu pilihan layout di sisi kiri untuk langsung melihat live preview tampilan Home di sisi kanan tanpa perlu scroll."
            : "Hover over any layout option on the left to immediately inspect the live Home dashboard preview on the right without scrolling."}
        </p>
      </div>

      {/* ── Side-by-Side 2-Column Split: Options on Left, Sticky Live Preview on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Layout Option Cards */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between px-1">
            <span>{isId ? "Pilih Format Tata Letak" : "Select Layout Format"}</span>
            <span className="text-[10px] text-accent lowercase font-mono">
              {hovered ? (isId ? "sedang dipratinjau" : "previewing") : (isId ? "klik untuk memilih" : "click to apply")}
            </span>
          </div>

          <div className="space-y-2.5">
            {LAYOUTS.map((layout) => {
              const isSelected = selected === layout.id;
              const isHovered = hovered === layout.id;

              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => handleSelect(layout.id)}
                  onMouseEnter={() => setHovered(layout.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "group relative w-full text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-accent ring-1 ring-accent/40 bg-accent/[0.06] shadow-sm"
                      : isHovered
                      ? "border-accent/80 bg-accent/[0.04] ring-1 ring-accent/30 shadow-md scale-[1.01]"
                      : "border-border/60 bg-background hover:border-accent/40 hover:bg-elevated/40"
                  )}
                >
                  {/* Status Badges */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 size-5 rounded-full bg-accent flex items-center justify-center text-white shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}

                  {isHovered && !isSelected && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[9.5px] font-semibold shadow-xs animate-pulse">
                      <Eye size={10} />
                      <span>{isId ? "Pratinjau" : "Preview"}</span>
                    </div>
                  )}

                  <div>
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={cn(
                          "shrink-0 p-1 rounded-md transition-colors",
                          isSelected || isHovered
                            ? "bg-accent/15 text-accent"
                            : "bg-elevated text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {layout.icon}
                      </div>
                      <p
                        className={cn(
                          "text-xs font-bold leading-tight",
                          isSelected || isHovered ? "text-accent" : "text-foreground"
                        )}
                      >
                        {isId ? layout.label.id : layout.label.en}
                      </p>
                    </div>

                    {/* Miniature wireframe preview */}
                    <div className={cn(
                      "mb-2.5 p-2 rounded-lg border transition-colors",
                      isHovered ? "bg-accent/10 border-accent/30" : "bg-elevated/20 border-border/30"
                    )}>
                      <LayoutMiniWireframe layout={layout} />
                    </div>

                    {/* Description */}
                    <p className="text-[10.5px] text-muted-foreground/80 leading-relaxed mb-2">
                      {isId ? layout.desc.id : layout.desc.en}
                    </p>
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-0.5 pt-1.5 border-t border-border/20">
                    {(isId ? layout.features.id : layout.features.en).map((feat, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground/75">
                        <span className="size-1 rounded-full bg-accent/60 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sticky Live Preview Window (Always visible at eye level) */}
        <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-4 self-start">
          <div className="space-y-2">
            {/* Top Bar with Live Indicator & Actions */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-colors border",
                    hovered
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full animate-ping",
                      hovered ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                  {hovered
                    ? (isId
                        ? `Meninjau: Layout ${activeLayoutConfig.label.id}`
                        : `Previewing: ${activeLayoutConfig.label.en} Layout`)
                    : (isId
                        ? `Aktif: Layout ${activeLayoutConfig.label.id}`
                        : `Active: ${activeLayoutConfig.label.en} Layout`)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hovered && hovered !== selected && (
                  <button
                    type="button"
                    onClick={() => handleSelect(hovered)}
                    className="px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-semibold hover:bg-accent/90 shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Check size={11} strokeWidth={3} />
                    {isId ? `Terapkan "${activeLayoutConfig.label.id}"` : `Apply "${activeLayoutConfig.label.en}"`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-2 py-1 rounded-lg border border-border bg-elevated/40 hover:bg-elevated text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all cursor-pointer"
                  title={isId ? "Tampilkan Layar Penuh" : "Fullscreen View"}
                >
                  <Maximize2 size={11} />
                  <span className="hidden sm:inline">{isId ? "Perbesar" : "Full View"}</span>
                </button>
              </div>
            </div>

            {/* Desktop Simulation Window */}
            <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden transition-all duration-300">
              {/* Window Titlebar */}
              <div className="px-3.5 py-2 border-b border-border/50 bg-elevated/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500/80" />
                    <span className="size-2 rounded-full bg-amber-500/80" />
                    <span className="size-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground ml-1.5">
                    maybe-finance / home • {activeLayoutConfig.label.id}
                  </span>
                </div>
                <span className="text-[8.5px] font-semibold text-muted-foreground bg-surface/60 border border-border/40 px-2 py-0.5 rounded-md">
                  {isId ? "Live Home Simulation" : "Live Home Simulation"}
                </span>
              </div>

              {/* Scrollable Mockup Content Area (max height constrained to viewport) */}
              <div className="p-3.5 sm:p-4 bg-background max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 space-y-3">
                <LiveDashboardHomeMockup layoutId={activeLayout} isId={isId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Preview Modal (Portaled to document.body to prevent clipping by parent scroll/headers) ── */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[90vh] my-auto flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — shrink-0 and sticky top-0 ensures it is NEVER compressed, clipped, or squashed */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-elevated/80 backdrop-blur-sm shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-accent/15 text-accent shrink-0">
                    {activeLayoutConfig.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                      {isId
                        ? `Pratinjau Layar Penuh: Layout ${activeLayoutConfig.label.id}`
                        : `Full Screen Preview: ${activeLayoutConfig.label.en} Layout`}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate hidden xs:block">
                      {isId ? activeLayoutConfig.desc.id : activeLayoutConfig.desc.en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeLayout !== selected && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelect(activeLayout);
                        setIsModalOpen(false);
                      }}
                      className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Check size={13} strokeWidth={3} />
                      <span className="hidden sm:inline">
                        {isId ? "Terapkan Layout Ini" : "Apply This Layout"}
                      </span>
                      <span className="sm:hidden">{isId ? "Terapkan" : "Apply"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-elevated text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title={isId ? "Tutup (Esc)" : "Close (Esc)"}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body — flex-1 min-h-0 guarantees clean internal scrolling without cutting off header */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 bg-background">
                <LiveDashboardHomeMockup layoutId={activeLayout} isId={isId} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
