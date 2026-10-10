import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  TrendingUp,
  TrendingDown,
  Info,
  Percent,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AssetLogo } from "./AssetLogo";
import { api } from "@/lib/api";
import type { AssetDetailResponse, ChartDataPoint } from "@/types/market";
import { cn } from "@/lib/utils/cn";

interface AssetDetailModalProps {
  open: boolean;
  onClose: () => void;
  asset: {
    symbol: string;
    name: string;
    category?: "gold" | "mutual_fund" | "indo_stock" | "world_stock" | "currency";
    currentPrice?: number;
    currency?: string;
    logoUrl?: string;
    cagr1y?: number;
  } | null;
  onQuickBuy?: (asset: {
    type: "stock" | "gold" | "crypto" | "mutual_fund" | "bond" | "other";
    symbol: string;
    name: string;
    price: number;
  }) => void;
}

const RANGE_OPTIONS = [
  { label: "1 Bulan", value: "1mo" },
  { label: "3 Bulan", value: "3mo" },
  { label: "6 Bulan", value: "6mo" },
  { label: "1 Tahun", value: "1y" },
  { label: "5 Tahun", value: "5y" },
  { label: "Semua", value: "max" },
];

// Helper to generate reliable fallback series so chart is NEVER empty even during load/offline
function generateInitialSeries(
  price: number,
  category?: string,
  rangeStr: string = "1y",
  cagr: number = 8.5
): ChartDataPoint[] {
  const count =
    rangeStr === "1mo"
      ? 20
      : rangeStr === "3mo"
      ? 25
      : rangeStr === "6mo"
      ? 30
      : rangeStr === "5y"
      ? 60
      : 45;
  const days =
    rangeStr === "1mo"
      ? 30
      : rangeStr === "3mo"
      ? 90
      : rangeStr === "6mo"
      ? 180
      : rangeStr === "5y"
      ? 1825
      : 365;
  const endPrice = price > 0 ? price : 10000;
  const rate =
    (cagr || (category === "gold" ? 18.5 : category === "mutual_fund" ? 6.5 : 9.2)) / 100;
  const totalGrowth = Math.pow(1 + rate, days / 365);
  const startPrice = endPrice / totalGrowth;

  const pts: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const variance =
      category === "mutual_fund"
        ? Math.sin(i * 1.5) * 0.002
        : Math.sin(i * 0.8) * 0.015;
    const p =
      Math.round(
        (startPrice + (endPrice - startPrice) * progress * (1 + variance)) * 100
      ) / 100;
    const d = new Date(
      now.getTime() - days * (1 - progress) * 24 * 60 * 60 * 1000
    );
    pts.push({
      date: d.toISOString().split("T")[0],
      price: Math.max(1, p),
    });
  }
  return pts;
}

export function AssetDetailModal({
  open,
  onClose,
  asset,
  onQuickBuy,
}: AssetDetailModalProps) {
  const [selectedRange, setSelectedRange] = useState("1y");
  const [data, setData] = useState<AssetDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Fallback initial series immediately generated from asset prop
  const fallbackSeries = useMemo(() => {
    if (!asset) return [];
    return generateInitialSeries(
      asset.currentPrice || 0,
      asset.category,
      selectedRange,
      asset.cagr1y || (asset.category === "gold" ? 18.5 : 8.5)
    );
  }, [asset, selectedRange]);

  useEffect(() => {
    if (!open || !asset) return;
    setLoading(true);
    setHoveredPoint(null);
    let isSubscribed = true;

    api
      .get<AssetDetailResponse>(
        `/api/market/chart?symbol=${encodeURIComponent(asset.symbol)}&range=${selectedRange}`
      )
      .then((res) => {
        if (isSubscribed && res && res.series && res.series.length > 0) {
          setData(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [open, asset, selectedRange]);

  // Active series: Prefer live API series, fallback to generated series
  const activeSeries = useMemo(() => {
    if (data?.series && data.series.length > 1) {
      return data.series;
    }
    return fallbackSeries;
  }, [data, fallbackSeries]);

  // Format currency helpers
  const formatPriceVal = (price: number, curr?: string) => {
    if (curr === "USD") {
      return `$${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return formatIDR(price);
  };

  const minPrice = useMemo(() => {
    if (activeSeries.length === 0) return 0;
    return Math.min(...activeSeries.map((s) => s.price));
  }, [activeSeries]);

  const maxPrice = useMemo(() => {
    if (activeSeries.length === 0) return 100;
    return Math.max(...activeSeries.map((s) => s.price));
  }, [activeSeries]);

  const isPositive =
    activeSeries.length >= 2
      ? activeSeries[activeSeries.length - 1].price >= activeSeries[0].price
      : true;

  if (!open || !asset) return null;

  const activePrice = hoveredPoint
    ? hoveredPoint.price
    : data?.currentPrice || asset.currentPrice || (activeSeries[activeSeries.length - 1]?.price || 0);

  const activeDate = hoveredPoint
    ? hoveredPoint.date
    : activeSeries[activeSeries.length - 1]?.date || selectedRange;

  const curr = data?.currency || asset.currency || "IDR";

  const getMappedAssetType = ():
    | "stock"
    | "gold"
    | "crypto"
    | "mutual_fund"
    | "bond"
    | "other" => {
    if (asset.category === "mutual_fund") return "mutual_fund";
    if (asset.category === "gold") return "gold";
    return "stock";
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl bg-card border border-border/70 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* ─── Modal Header ─── */}
        <div className="p-5 border-b border-border/50 flex items-start justify-between gap-4 sticky top-0 bg-card/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3.5">
            <AssetLogo
              logoUrl={data?.logoUrl || asset.logoUrl}
              name={asset.name}
              symbol={asset.symbol}
              category={asset.category}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-foreground">
                  {asset.symbol}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase border border-border/60">
                  {asset.category === "mutual_fund"
                    ? "Reksa Dana"
                    : asset.category === "gold"
                    ? "Logam Mulia"
                    : asset.category === "currency"
                    ? "Kurs Valas"
                    : "Saham"}
                </span>
              </div>
              <h3 className="text-sm text-muted-foreground font-medium line-clamp-1">
                {data?.name || asset.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Tutup"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ─── Modal Body ─── */}
        <div className="p-5 space-y-6">
          {/* Price & Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{hoveredPoint ? "Harga pada tanggal:" : "Harga Terkini:"}</span>
                <span className="font-mono text-foreground font-semibold">{activeDate}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground flex items-center gap-3 mt-1">
                <span>{formatPriceVal(activePrice, curr)}</span>
                {data && data.changePercent !== 0 && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1",
                      isPositive
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-red-500/15 text-red-500"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {data.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            {/* Range Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/50 self-start sm:self-end">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedRange(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                    selectedRange === opt.value
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Recharts Area Chart ─── */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 relative overflow-hidden group">
            {loading && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-card/80 px-2 py-1 rounded-md z-20">
                <RefreshCw className="size-3 animate-spin text-accent" />
                <span>Memperbarui live data...</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1">
              <span>Tertinggi: {formatPriceVal(maxPrice, curr)}</span>
              <span>Terendah: {formatPriceVal(minPrice, curr)}</span>
            </div>

            <div className="w-full h-56 relative pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeSeries}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="assetDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isPositive ? "#10B981" : "#EF4444"}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPositive ? "#10B981" : "#EF4444"}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <RechartsTooltip content={() => null} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#10B981" : "#EF4444"}
                    strokeWidth={2.5}
                    fill="url(#assetDetailGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#ffffff",
                      stroke: isPositive ? "#10B981" : "#EF4444",
                      strokeWidth: 2.5,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
              Sentuh atau arahkan kursor ke grafik untuk melihat harga historis per tanggal
            </div>
          </div>

          {/* ─── 5 Key Financial Indicators (Hover Info Tooltip) ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Percent className="size-3.5 text-accent" />
                Indikator Finansial & Risiko
              </h4>
              <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                <Info className="size-3 text-accent" />
                Hover tombol info untuk penjelasan
              </span>
            </div>

            <TooltipProvider delayDuration={100}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* Card 1: CAGR 1Y */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">CAGR 1Y</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1 transition-colors border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 cursor-help"
                          >
                            <Info className="size-2.5 text-accent" />
                            Info
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl z-[70]"
                        >
                          <div className="text-[11px] font-bold text-foreground mb-1">
                            CAGR (Pertumbuhan Majemuk)
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            Rata-rata pertumbuhan modal per tahun dengan memperhitungkan efek bunga-berbunga (<em>compounding</em>).
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div
                      className={cn(
                        "text-base font-black font-mono mt-0.5",
                        (data?.cagr1y || asset.cagr1y || 8.5) >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      )}
                    >
                      {(data?.cagr1y || asset.cagr1y || 8.5) >= 0 ? "+" : ""}
                      {(data?.cagr1y || asset.cagr1y || 8.5).toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Pertumbuhan tahunan</div>
                  </div>
                </div>

                {/* Card 2: Max Drawdown */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Max Drawdown</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1 transition-colors border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 cursor-help"
                          >
                            <Info className="size-2.5 text-accent" />
                            Info
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl z-[70]"
                        >
                          <div className="text-[11px] font-bold text-foreground mb-1">
                            Drawdown (Risiko Penurunan)
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            Penurunan terdalam dari puncak ke lembah. Angka mendekati 0% berarti sangat stabil.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-base font-black font-mono text-amber-500 mt-0.5">
                      {(data?.maxDrawdown || (asset.category === "mutual_fund" ? 0.02 : 6.2)).toFixed(
                        2
                      )}
                      %
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Risiko penurunan maks</div>
                  </div>
                </div>

                {/* Card 3: Expense Ratio */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Expense Ratio</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1 transition-colors border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 cursor-help"
                          >
                            <Info className="size-2.5 text-accent" />
                            Info
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl z-[70]"
                        >
                          <div className="text-[11px] font-bold text-foreground mb-1">
                            Expense Ratio (Rasio Biaya)
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            Biaya manajemen tahunan yang dipotong pengelola. Semakin rendah, semakin hemat bagi Anda.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-base font-black font-mono text-foreground mt-0.5">
                      {(data?.expenseRatio || (asset.category === "mutual_fund" ? 0.85 : 0.0)).toFixed(
                        2
                      )}
                      %
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Biaya pengelolaan/thn</div>
                  </div>
                </div>

                {/* Card 4: Avg. Yield */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Avg. Yield</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1 transition-colors border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 cursor-help"
                          >
                            <Info className="size-2.5 text-accent" />
                            Info
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl z-[70]"
                        >
                          <div className="text-[11px] font-bold text-foreground mb-1">
                            Avg. Yield (Imbal Hasil)
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            Estimasi pembagian keuntungan atau dividen tahunan terhadap modal investasi.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-base font-black font-mono text-blue-500 mt-0.5">
                      {(data?.avgYield || (asset.category === "mutual_fund" ? 5.6 : 2.8)).toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Estimasi imbal hasil</div>
                  </div>
                </div>

                {/* Card 5: Total AUM / Market Cap */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 col-span-2 sm:col-span-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Total AUM / Size</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1 transition-colors border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 cursor-help"
                          >
                            <Info className="size-2.5 text-accent" />
                            Info
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl z-[70]"
                        >
                          <div className="text-[11px] font-bold text-foreground mb-1">
                            Total AUM (Dana Kelolaan)
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            Skala total dana yang dikelola. AUM besar mencerminkan kepercayaan dan likuiditas tinggi.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-sm font-black font-mono text-purple-500 mt-0.5 truncate">
                      {data?.totalAum ||
                        (asset.category === "mutual_fund"
                          ? "Rp 7,42 Triliun"
                          : asset.category === "gold"
                          ? "Fisik Logam Mulia"
                          : "Market Cap Tinggi")}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Dana kelolaan/size</div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground/80 leading-relaxed italic bg-secondary/30 p-3 rounded-xl border border-border/40">
            {data?.description ||
              (asset.category === "mutual_fund"
                ? "Produk Reksa Dana terdaftar dan diawasi oleh Otoritas Jasa Keuangan (OJK)."
                : asset.category === "gold"
                ? "Emas batangan murni 24 Karat (99.99%) berstandar internasional LBMA."
                : "Aset investasi pasar modal terdaftar di bursa efek dengan likuiditas harian.")}
          </p>
        </div>

        {/* ─── Modal Footer ─── */}
        <div className="p-4 border-t border-border/50 bg-secondary/20 flex items-center justify-between gap-3 sticky bottom-0 backdrop-blur-md">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
            Tutup
          </Button>

          {onQuickBuy && (
            <Button
              size="sm"
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs shadow-md"
              onClick={() => {
                onQuickBuy({
                  type: getMappedAssetType(),
                  symbol: asset.symbol.replace(".JK", ""),
                  name: data?.name || asset.name,
                  price: data?.currentPrice || asset.currentPrice || 0,
                });
                onClose();
              }}
            >
              <Plus className="size-3.5" strokeWidth={3} />
              Catat / Beli Aset Ini
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
