import { useState, useMemo } from "react";
import {
  Coins,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Globe,
  Building2,
  DollarSign,
  Plus,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetLogo } from "./AssetLogo";
import { Sparkline } from "./Sparkline";
import { AssetDetailModal } from "./AssetDetailModal";
import type { MarketOverviewData } from "@/types/market";
import { cn } from "@/lib/utils/cn";

interface MarketOverviewViewProps {
  data: MarketOverviewData | null;
  loading: boolean;
  onRefresh: () => void;
  onQuickBuy?: (asset: {
    type: "stock" | "gold" | "crypto" | "mutual_fund" | "bond" | "other";
    symbol: string;
    name: string;
    price: number;
  }) => void;
}

type TabCategory = "all" | "gold" | "mutual_fund" | "indo_stock" | "world_stock" | "currency";

export function MarketOverviewView({
  data,
  loading,
  onRefresh,
  onQuickBuy,
}: MarketOverviewViewProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // "See more" expansion toggles per category
  const [mfVisibleCount, setMfVisibleCount] = useState(10);
  const [indoVisibleCount, setIndoVisibleCount] = useState(10);
  const [showAllWorld, setShowAllWorld] = useState(false);
  const [showAllCurr, setShowAllCurr] = useState(false);

  // Selected asset for Detail Modal
  const [selectedAsset, setSelectedAsset] = useState<{
    symbol: string;
    name: string;
    category?: "gold" | "mutual_fund" | "indo_stock" | "world_stock" | "currency";
    currentPrice?: number;
    currency?: string;
    logoUrl?: string;
  } | null>(null);

  const gold = data?.gold;
  const mutualFunds = data?.mutualFunds || [];
  const stocksIndo = data?.stocksIndo || [];
  const stocksWorld = data?.stocksWorld || [];
  const currencies = data?.currencies || [];

  // Filter items based on search query
  const filterList = <T extends { symbol: string; name: string }>(items: T[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  };

  const filteredMF = useMemo(() => filterList(mutualFunds), [mutualFunds, searchQuery]);
  const filteredIndo = useMemo(() => filterList(stocksIndo), [stocksIndo, searchQuery]);
  const filteredWorld = useMemo(() => filterList(stocksWorld), [stocksWorld, searchQuery]);
  const filteredCurrencies = useMemo(() => filterList(currencies), [currencies, searchQuery]);

  // Sliced items for "See more"
  const visibleMF = searchQuery ? filteredMF : filteredMF.slice(0, mfVisibleCount);
  const visibleIndo = searchQuery ? filteredIndo : filteredIndo.slice(0, indoVisibleCount);
  const visibleWorld = showAllWorld || searchQuery ? filteredWorld : filteredWorld.slice(0, 8);
  const visibleCurr = showAllCurr || searchQuery ? filteredCurrencies : filteredCurrencies.slice(0, 6);

  // Format currency helpers
  const formatPrice = (price: number, curr?: string) => {
    if (curr === "USD") {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatIDR(price);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card/90 to-secondary/30 border border-border/60 shadow-sm backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 font-mono">
              Live Market Rates
            </span>
            <span className="text-xs text-muted-foreground/60">•</span>
            <span className="text-xs text-muted-foreground">
              {data?.lastRefreshed
                ? `Diperbarui ${new Date(data.lastRefreshed).toLocaleTimeString("id-ID")}`
                : "Sinkronisasi otomatis"}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Pantauan Pasar & Harga Aset
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Harga resmi Emas Logam Mulia Indonesia, Reksa Dana (Pasar Uang, Saham, Pendapatan Tetap), Saham IHSG, Saham Dunia, dan Kurs Valas (USD).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 gap-2 border-border/80 hover:bg-secondary/80 text-xs font-medium"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-accent")} />
            {loading ? "Memuat Data..." : "Segarkan"}
          </Button>
        </div>
      </div>

      {/* ─── Live Highlight Ticker Pill ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Antam 1g */}
        <div
          onClick={() =>
            setSelectedAsset({
              symbol: "ANTAM",
              name: "Emas Logam Mulia Antam (1g)",
              category: "gold",
              currentPrice: gold?.antamPrice1g || 2722000,
              currency: "IDR",
              logoUrl: "/logos/antam.svg",
            })
          }
          className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AssetLogo
              logoUrl="/logos/antam.svg"
              name="Antam Gold"
              symbol="ANTAM"
              category="gold"
              size="sm"
            />
            <div>
              <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
                Emas Antam (1g)
              </div>
              <div className="text-sm font-bold text-foreground">
                {gold ? formatIDR(gold.antamPrice1g) : "Rp 2.722.000"}
              </div>
            </div>
          </div>
          {onQuickBuy && gold && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-amber-500 hover:bg-amber-500/20"
              title="Catat Beli Emas"
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy({
                  type: "gold",
                  symbol: "ANTAM",
                  name: "Emas Logam Mulia Antam (1g)",
                  price: gold.antamPrice1g,
                });
              }}
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Top Mutual Fund: Sucorinvest Money Market */}
        <div
          onClick={() =>
            mutualFunds[0] &&
            setSelectedAsset({
              symbol: mutualFunds[0].symbol,
              name: mutualFunds[0].name,
              category: "mutual_fund",
              currentPrice: mutualFunds[0].price,
              currency: "IDR",
              logoUrl: mutualFunds[0].logoUrl,
            })
          }
          className="p-3.5 rounded-xl border border-cyan-500/25 bg-cyan-500/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AssetLogo
              logoUrl="/logos/sucor.svg"
              name="Sucor MMF"
              symbol="SUCOR"
              category="mutual_fund"
              size="sm"
            />
            <div>
              <div className="text-[11px] font-semibold text-cyan-500 uppercase tracking-wider">
                Sucorinvest MMF
              </div>
              <div className="text-sm font-bold text-foreground">
                {mutualFunds[0] ? formatIDR(mutualFunds[0].price) : "Rp 1.584"}
              </div>
            </div>
          </div>
          {mutualFunds[0] && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
              +{mutualFunds[0].cagr1y}%
            </span>
          )}
        </div>

        {/* USD / IDR */}
        <div
          onClick={() =>
            currencies[0] &&
            setSelectedAsset({
              symbol: currencies[0].symbol,
              name: currencies[0].name,
              category: "currency",
              currentPrice: currencies[0].price,
              currency: "IDR",
              logoUrl: currencies[0].logoUrl,
            })
          }
          className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AssetLogo
              logoUrl="https://flagcdn.com/w80/us.png"
              name="US Dollar"
              symbol="USDIDR=X"
              category="currency"
              size="sm"
            />
            <div>
              <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                USD / IDR
              </div>
              <div className="text-sm font-bold text-foreground">
                {currencies[0]?.price ? formatIDR(currencies[0].price) : "Rp 17.875"}
              </div>
            </div>
          </div>
        </div>

        {/* Top Indo Stock: BBCA */}
        <div
          onClick={() =>
            stocksIndo[0] &&
            setSelectedAsset({
              symbol: stocksIndo[0].symbol,
              name: stocksIndo[0].name,
              category: "indo_stock",
              currentPrice: stocksIndo[0].price,
              currency: "IDR",
              logoUrl: stocksIndo[0].logoUrl,
            })
          }
          className="p-3.5 rounded-xl border border-blue-500/25 bg-blue-500/5 flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AssetLogo
              logoUrl="/logos/bbca.svg"
              name="Bank Central Asia"
              symbol="BBCA.JK"
              category="indo_stock"
              size="sm"
            />
            <div>
              <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                BBCA.JK
              </div>
              <div className="text-sm font-bold text-foreground">
                {stocksIndo[0]?.price ? formatIDR(stocksIndo[0].price) : "Rp 6.050"}
              </div>
            </div>
          </div>
          {stocksIndo[0] && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                stocksIndo[0].changePercent >= 0
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-red-500/15 text-red-500"
              )}
            >
              {stocksIndo[0].changePercent >= 0 ? "+" : ""}
              {stocksIndo[0].changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* ─── Search & Tab Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === "all"
                ? "bg-card text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semua Aset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gold")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === "gold"
                ? "bg-card text-amber-500 shadow-sm border border-amber-500/30"
                : "text-muted-foreground hover:text-amber-500"
            )}
          >
            <Coins className="size-3.5" />
            Emas Indonesia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mutual_fund")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === "mutual_fund"
                ? "bg-card text-cyan-500 shadow-sm border border-cyan-500/30"
                : "text-muted-foreground hover:text-cyan-500"
            )}
          >
            <Briefcase className="size-3.5" />
            Reksa Dana
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("indo_stock")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === "indo_stock"
                ? "bg-card text-blue-500 shadow-sm border border-blue-500/30"
                : "text-muted-foreground hover:text-blue-500"
            )}
          >
            <Building2 className="size-3.5" />
            Saham IHSG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("world_stock")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === "world_stock"
                ? "bg-card text-purple-500 shadow-sm border border-purple-500/30"
                : "text-muted-foreground hover:text-purple-500"
            )}
          >
            <Globe className="size-3.5" />
            Saham Dunia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("currency")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === "currency"
                ? "bg-card text-emerald-500 shadow-sm border border-emerald-500/30"
                : "text-muted-foreground hover:text-emerald-500"
            )}
          >
            <DollarSign className="size-3.5" />
            Kurs Valas (USD+)
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari emiten, reksa dana, emas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-card/80 border-border/70"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ─── 1. Emas Indonesia Section ─── */}
      {(activeTab === "all" || activeTab === "gold") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                <Coins className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                1. Harga Emas Logam Mulia Indonesia
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {gold?.date ? `Update Resmi: ${gold.date}` : "Harga Hari Ini"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Antam Card */}
            <Card
              onClick={() =>
                setSelectedAsset({
                  symbol: "ANTAM",
                  name: "Emas Logam Mulia Antam (1g)",
                  category: "gold",
                  currentPrice: gold?.antamPrice1g || 2722000,
                  currency: "IDR",
                  logoUrl: "/logos/antam.svg",
                })
              }
              className="p-5 border-amber-500/25 bg-gradient-to-br from-card via-card to-amber-500/5 space-y-4 cursor-pointer hover:border-amber-500/50 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AssetLogo
                    logoUrl="/logos/antam.svg"
                    name="PT Aneka Tambang Tbk"
                    symbol="ANTAM"
                    category="gold"
                    size="lg"
                  />
                  <div>
                    <div className="text-xs font-semibold text-amber-500">
                      PT Aneka Tambang Tbk
                    </div>
                    <h4 className="text-base font-bold text-foreground">
                      Emas Logam Mulia Antam
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <ShieldCheck className="size-3 text-emerald-500" /> Sertifikasi LBMA Resmi • Klik untuk Grafik
                    </span>
                  </div>
                </div>

                {onQuickBuy && gold && (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy({
                        type: "gold",
                        symbol: "ANTAM",
                        name: "Emas Logam Mulia Antam (1g)",
                        price: gold.antamPrice1g,
                      });
                    }}
                  >
                    <Plus className="size-3.5" />
                    Catat Beli
                  </Button>
                )}
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border/50">
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Harga Jual / Beli (1 gr)
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {gold ? formatIDR(gold.antamPrice1g) : "Rp 2.722.000"}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
                    CAGR 1Y: ~18.5%
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Harga Buyback (1 gr)
                  </div>
                  <div className="text-lg font-black text-amber-500">
                    {gold && gold.antamBuyback1g > 0
                      ? formatIDR(gold.antamBuyback1g)
                      : "Rp 2.449.800"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Harga beli kembali oleh Antam
                  </div>
                </div>
              </div>

              {/* Denominations table */}
              {gold && gold.antamDenoms && gold.antamDenoms.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Pecahan Emas Antam:</span>
                    <span className="text-[11px] font-normal">Harga Batangan</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gold.antamDenoms
                      .filter((d) => [0.5, 1, 2, 5, 10, 25, 50, 100].includes(d.weight))
                      .sort((a, b) => a.weight - b.weight)
                      .map((denom) => (
                        <div
                          key={denom.weight}
                          className="p-2 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between text-xs hover:border-amber-500/40 transition-colors"
                        >
                          <span className="font-semibold text-foreground">
                            {denom.weight} {denom.unit}
                          </span>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {formatIDR(denom.sellPrice)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Pegadaian Card */}
            <Card
              onClick={() =>
                setSelectedAsset({
                  symbol: "PEGADAIAN",
                  name: "Emas Logam Mulia Pegadaian (1g)",
                  category: "gold",
                  currentPrice: gold?.pegadaianPrice1g || 2532000,
                  currency: "IDR",
                  logoUrl: "/logos/pegadaian.svg",
                })
              }
              className="p-5 border-emerald-500/25 bg-gradient-to-br from-card via-card to-emerald-500/5 space-y-4 cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AssetLogo
                    logoUrl="/logos/pegadaian.svg"
                    name="PT Pegadaian (Persero)"
                    symbol="PEGADAIAN"
                    category="gold"
                    size="lg"
                  />
                  <div>
                    <div className="text-xs font-semibold text-emerald-500">
                      PT Pegadaian (Persero)
                    </div>
                    <h4 className="text-base font-bold text-foreground">
                      Emas Logam Mulia Pegadaian
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <ShieldCheck className="size-3 text-emerald-500" /> Jaringan Galeri 24 Nasional • Klik untuk Grafik
                    </span>
                  </div>
                </div>

                {onQuickBuy && gold && (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy({
                        type: "gold",
                        symbol: "PEGADAIAN",
                        name: "Emas Logam Mulia Pegadaian (1g)",
                        price: gold.pegadaianPrice1g,
                      });
                    }}
                  >
                    <Plus className="size-3.5" />
                    Catat Beli
                  </Button>
                )}
              </div>

              {/* Price Row */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50">
                <div className="text-[11px] text-muted-foreground font-medium">
                  Harga Jual / Beli (1 gr)
                </div>
                <div className="text-lg font-black text-foreground">
                  {gold && gold.pegadaianPrice1g > 0
                    ? formatIDR(gold.pegadaianPrice1g)
                    : "Rp 2.532.000"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Tersedia di seluruh Galeri 24 Pegadaian
                </div>
              </div>

              {/* Pegadaian Denoms */}
              {gold && gold.pegadaianDenoms && gold.pegadaianDenoms.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Pecahan Emas Pegadaian:</span>
                    <span className="text-[11px] font-normal">Harga Batangan</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gold.pegadaianDenoms
                      .filter((d) => [0.5, 1, 2, 5, 10, 25, 50, 100].includes(d.weight))
                      .sort((a, b) => a.weight - b.weight)
                      .map((denom) => (
                        <div
                          key={denom.weight}
                          className="p-2 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between text-xs hover:border-emerald-500/40 transition-colors"
                        >
                          <span className="font-semibold text-foreground">
                            {denom.weight} {denom.unit}
                          </span>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {formatIDR(denom.sellPrice)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─── 2. Reksa Dana Indonesia (Mutual Funds) Section ─── */}
      {(activeTab === "all" || activeTab === "mutual_fund") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-500">
                <Briefcase className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                2. Reksa Dana Unggulan Indonesia (Top 40 Reksa Dana)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Menampilkan {Math.min(visibleMF.length, filteredMF.length)} dari {filteredMF.length} Reksa Dana
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleMF.map((mf) => {
              return (
                <Card
                  key={mf.symbol}
                  onClick={() =>
                    setSelectedAsset({
                      symbol: mf.symbol,
                      name: mf.name,
                      category: "mutual_fund",
                      currentPrice: mf.price,
                      currency: mf.currency,
                      logoUrl: mf.logoUrl,
                    })
                  }
                  className="p-4 border-border/70 hover:border-cyan-500/40 transition-all duration-200 bg-card hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AssetLogo
                        logoUrl={mf.logoUrl}
                        name={mf.name}
                        symbol={mf.symbol}
                        category="mutual_fund"
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black tracking-tight text-foreground group-hover:text-cyan-500 transition-colors">
                          {mf.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {mf.manager} • <span className="font-semibold text-cyan-500">{mf.fundType}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold shrink-0 bg-emerald-500/15 text-emerald-500">
                      <ArrowUpRight className="size-3" />
                      +{mf.cagr1y}% 1Y
                    </span>
                  </div>

                  {/* Price & Sparkline */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">NAB / Unit:</div>
                      <div className="text-base font-black text-foreground tracking-tight">
                        {formatIDR(mf.price)}
                      </div>
                    </div>

                    {mf.sparkline && mf.sparkline.length > 1 && (
                      <Sparkline
                        data={mf.sparkline}
                        isPositive={true}
                        width={70}
                        height={24}
                      />
                    )}
                  </div>

                  {/* Metrics Row: Drawdown, Expense Ratio, AUM */}
                  <div className="pt-2 border-t border-border/40 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Drawdown</span>
                      <span className="font-bold text-foreground font-mono">{mf.maxDrawdown}%</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Expense R.</span>
                      <span className="font-bold text-foreground font-mono">{mf.expenseRatio}%</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] text-muted-foreground/70">Total AUM</span>
                      <span className="font-bold text-cyan-500 font-mono truncate block">{mf.totalAum}</span>
                    </div>
                  </div>

                  {/* Buy action */}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-accent font-semibold group-hover:underline">
                      Lihat Grafik & Detail →
                    </span>
                    {onQuickBuy && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-accent hover:bg-accent/10 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBuy({
                            type: "mutual_fund",
                            symbol: mf.symbol,
                            name: mf.name,
                            price: mf.price,
                          });
                        }}
                      >
                        + Catat
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Incremental pagination (+10 card per click) */}
          {!searchQuery && filteredMF.length > 10 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
              {visibleMF.length < filteredMF.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMfVisibleCount((prev) =>
                      Math.min(prev + 10, filteredMF.length)
                    )
                  }
                  className="text-xs gap-1.5 h-8 border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5 hover:bg-cyan-500/10 text-foreground font-semibold"
                >
                  <ChevronDown className="size-3.5 text-cyan-500" />
                  Tampilkan 10 Reksa Dana Lagi (+10)
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                    Sisa {filteredMF.length - visibleMF.length}
                  </span>
                </Button>
              )}

              {visibleMF.length < filteredMF.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMfVisibleCount(filteredMF.length)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  Tampilkan Semua ({filteredMF.length})
                </Button>
              )}

              {mfVisibleCount > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMfVisibleCount(10)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1"
                >
                  <ChevronUp className="size-3.5" />
                  Ciutkan ke 10 Reksa Dana
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── 3. Saham Indonesia (IHSG) Section ─── */}
      {(activeTab === "all" || activeTab === "indo_stock") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                <Building2 className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                3. Saham Indonesia (IHSG - Blue Chip & Konstituen Utama)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Menampilkan {Math.min(visibleIndo.length, filteredIndo.length)} dari {filteredIndo.length} Emiten
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleIndo.map((stock) => {
              const isPos = stock.changePercent >= 0;
              return (
                <Card
                  key={stock.symbol}
                  onClick={() =>
                    setSelectedAsset({
                      symbol: stock.symbol,
                      name: stock.name,
                      category: "indo_stock",
                      currentPrice: stock.price,
                      currency: stock.currency,
                      logoUrl: stock.logoUrl,
                    })
                  }
                  className="p-4 border-border/70 hover:border-blue-500/40 transition-all duration-200 bg-card hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AssetLogo
                        logoUrl={stock.logoUrl}
                        name={stock.name}
                        symbol={stock.symbol}
                        category="indo_stock"
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black tracking-tight text-foreground group-hover:text-blue-500 transition-colors">
                          {stock.symbol.replace(".JK", "")}
                        </div>
                        <div
                          className="text-[10px] text-muted-foreground line-clamp-1"
                          title={stock.name}
                        >
                          {stock.name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold shrink-0",
                        isPos
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-red-500/15 text-red-500"
                      )}
                    >
                      {isPos ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {isPos ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Price & Sparkline */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">Harga Saham:</div>
                      <div className="text-base font-black text-foreground tracking-tight">
                        {formatPrice(stock.price, stock.currency)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {stock.change !== 0 && (
                          <span className={isPos ? "text-emerald-500" : "text-red-500"}>
                            {stock.change > 0 ? "+" : ""}
                            {formatIDR(stock.change)} hari ini
                          </span>
                        )}
                      </div>
                    </div>

                    {stock.sparkline && stock.sparkline.length > 1 && (
                      <Sparkline
                        data={stock.sparkline}
                        isPositive={isPos}
                        width={70}
                        height={24}
                      />
                    )}
                  </div>

                  {/* Metrics Row: Drawdown, Div Yield, Market Cap (Same as Reksa Dana) */}
                  <div className="pt-2 border-t border-border/40 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Drawdown</span>
                      <span className="font-bold text-foreground font-mono">
                        {(stock.maxDrawdown || 6.2).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Div. Yield</span>
                      <span className="font-bold text-foreground font-mono">
                        {(stock.avgYield || 2.8).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] text-muted-foreground/70">Market Cap</span>
                      <span className="font-bold text-blue-500 font-mono truncate block">
                        {stock.totalAum || "Blue Chip"}
                      </span>
                    </div>
                  </div>

                  {/* Footer action row (Same as Reksa Dana) */}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-accent font-semibold group-hover:underline">
                      Lihat Grafik & Detail →
                    </span>
                    {onQuickBuy && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-accent hover:bg-accent/10 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBuy({
                            type: "stock",
                            symbol: stock.symbol.replace(".JK", ""),
                            name: stock.name,
                            price: stock.price,
                          });
                        }}
                      >
                        + Catat
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Incremental pagination (+10 card per click) */}
          {!searchQuery && filteredIndo.length > 10 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
              {visibleIndo.length < filteredIndo.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIndoVisibleCount((prev) =>
                      Math.min(prev + 10, filteredIndo.length)
                    )
                  }
                  className="text-xs gap-1.5 h-8 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-foreground font-semibold"
                >
                  <ChevronDown className="size-3.5 text-blue-500" />
                  Tampilkan 10 Saham Lagi (+10)
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                    Sisa {filteredIndo.length - visibleIndo.length}
                  </span>
                </Button>
              )}

              {visibleIndo.length < filteredIndo.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIndoVisibleCount(filteredIndo.length)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  Tampilkan Semua ({filteredIndo.length})
                </Button>
              )}

              {indoVisibleCount > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIndoVisibleCount(10)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1"
                >
                  <ChevronUp className="size-3.5" />
                  Ciutkan ke 10 Saham
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. Saham Dunia (US / Global) Section ─── */}
      {(activeTab === "all" || activeTab === "world_stock") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-500">
                <Globe className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                4. Saham Dunia (US / Global Tech Giants)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredWorld.length} Perusahaan Global
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {visibleWorld.map((stock) => {
              const isPos = stock.changePercent >= 0;
              return (
                <Card
                  key={stock.symbol}
                  onClick={() =>
                    setSelectedAsset({
                      symbol: stock.symbol,
                      name: stock.name,
                      category: "world_stock",
                      currentPrice: stock.price,
                      currency: stock.currency,
                      logoUrl: stock.logoUrl,
                    })
                  }
                  className="p-4 border-border/70 hover:border-purple-500/40 transition-all duration-200 bg-card hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AssetLogo
                        logoUrl={stock.logoUrl}
                        name={stock.name}
                        symbol={stock.symbol}
                        category="world_stock"
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black tracking-tight text-foreground group-hover:text-purple-500 transition-colors">
                          {stock.symbol}
                        </div>
                        <div
                          className="text-[11px] text-muted-foreground line-clamp-1"
                          title={stock.name}
                        >
                          {stock.name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold shrink-0",
                        isPos
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-red-500/15 text-red-500"
                      )}
                    >
                      {isPos ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {isPos ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Price & Sparkline */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <div className="text-base font-black text-foreground tracking-tight">
                        {formatPrice(stock.price, stock.currency)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {stock.change !== 0 && (
                          <span className={isPos ? "text-emerald-500" : "text-red-500"}>
                            {stock.change > 0 ? "+" : ""}${stock.change.toFixed(2)} hari ini
                          </span>
                        )}
                      </div>
                    </div>

                    {stock.sparkline && stock.sparkline.length > 1 && (
                      <Sparkline
                        data={stock.sparkline}
                        isPositive={isPos}
                        width={70}
                        height={24}
                      />
                    )}
                  </div>

                  {/* Metrics Row: Drawdown, Div Yield, Market Cap (Same as Reksa Dana & Saham IHSG) */}
                  <div className="pt-2 border-t border-border/40 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Drawdown</span>
                      <span className="font-bold text-foreground font-mono">
                        {(stock.maxDrawdown || 8.5).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground/70">Div. Yield</span>
                      <span className="font-bold text-foreground font-mono">
                        {(stock.avgYield || 0.4).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] text-muted-foreground/70">Market Cap</span>
                      <span className="font-bold text-purple-500 font-mono truncate block">
                        {stock.totalAum || "Mega Cap"}
                      </span>
                    </div>
                  </div>

                  {/* Footer action row */}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-accent font-semibold group-hover:underline">
                      Lihat Grafik & Detail →
                    </span>
                    {onQuickBuy && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-accent hover:bg-accent/10 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBuy({
                            type: "stock",
                            symbol: stock.symbol,
                            name: stock.name,
                            price: stock.price,
                          });
                        }}
                      >
                        + Catat
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* See more World Stocks */}
          {filteredWorld.length > 8 && !searchQuery && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllWorld((v) => !v)}
                className="text-xs gap-1.5 h-8 border-border/70"
              >
                {showAllWorld ? (
                  <>
                    <ChevronUp className="size-3.5" /> Ciutkan Daftar
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" /> Lihat {filteredWorld.length - 8} Saham Global Lainnya
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. Kurs Mata Uang Dunia (Forex / USD) Section ─── */}
      {(activeTab === "all" || activeTab === "currency") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                <DollarSign className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                5. Kurs Mata Uang Dunia (Terhadap Rupiah / IDR)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredCurrencies.length} Mata Uang Utama
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {visibleCurr.map((curr) => {
              const isPos = curr.changePercent >= 0;
              const code = curr.symbol.replace("IDR=X", "").replace("=X", "");
              return (
                <Card
                  key={curr.symbol}
                  onClick={() =>
                    setSelectedAsset({
                      symbol: curr.symbol,
                      name: curr.name,
                      category: "currency",
                      currentPrice: curr.price,
                      currency: "IDR",
                      logoUrl: curr.logoUrl,
                    })
                  }
                  className="p-4 border-border/70 hover:border-emerald-500/40 transition-all duration-200 bg-card hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AssetLogo
                        logoUrl={curr.logoUrl}
                        name={curr.name}
                        symbol={curr.symbol}
                        category="currency"
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black tracking-tight text-foreground group-hover:text-emerald-500 transition-colors">
                          {code} / IDR
                        </div>
                        <div
                          className="text-[11px] text-muted-foreground line-clamp-1"
                          title={curr.name}
                        >
                          {curr.name}
                        </div>
                      </div>
                    </div>

                    {curr.changePercent !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold shrink-0",
                          isPos
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-red-500/15 text-red-500"
                        )}
                      >
                        {isPos ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {isPos ? "+" : ""}
                        {curr.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>

                  {/* Price & Sparkline */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        1 {code} =
                      </div>
                      <div className="text-base font-black text-foreground tracking-tight">
                        {formatIDR(curr.price)}
                      </div>
                    </div>

                    {curr.sparkline && curr.sparkline.length > 1 && (
                      <Sparkline
                        data={curr.sparkline}
                        isPositive={isPos}
                        width={70}
                        height={24}
                      />
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Rentang: {formatIDR(curr.lowDay)} - {formatIDR(curr.highDay)}</span>
                    <span className="text-accent font-semibold group-hover:underline">Detail →</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* See more Currencies */}
          {filteredCurrencies.length > 6 && !searchQuery && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllCurr((v) => !v)}
                className="text-xs gap-1.5 h-8 border-border/70"
              >
                {showAllCurr ? (
                  <>
                    <ChevronUp className="size-3.5" /> Ciutkan Daftar
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" /> Lihat {filteredCurrencies.length - 6} Mata Uang Lainnya
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Detail Modal Component ─── */}
      <AssetDetailModal
        open={selectedAsset !== null}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
        onQuickBuy={onQuickBuy}
      />
    </div>
  );
}
