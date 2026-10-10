import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { AssetLogo } from "@/components/market/AssetLogo";
import { api } from "@/lib/api";
import type { MarketOverviewData } from "@/types/market";
import { cn } from "@/lib/utils/cn";

export function MarketTickerWidget({ isId }: { isId: boolean }) {
  const [data, setData] = useState<MarketOverviewData | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get<MarketOverviewData>("/api/market/overview")
      .then((res) => {
        if (isMounted && res) {
          setData(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const gold = data?.gold;
  const usd = data?.currencies?.find((c) => c.symbol.startsWith("USD"));
  const bbca = data?.stocksIndo?.find((s) => s.symbol.startsWith("BBCA"));
  const aapl = data?.stocksWorld?.find((s) => s.symbol === "AAPL");

  return (
    <Card className="p-3.5 border-border/70 bg-gradient-to-r from-card via-card/90 to-secondary/30 relative overflow-hidden group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="size-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {isId ? "Pantauan Pasar & Kurs Hari Ini" : "Market & FX Overview"}
              </span>
              <span className="flex size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isId ? "Emas Antam, USD/IDR & Saham Pilihan" : "Gold, USD & Featured Stocks"}
            </div>
          </div>
        </div>

        {/* Live Items */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Emas Antam */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/40 shrink-0">
            <AssetLogo
              logoUrl="/logos/antam.svg"
              name="Antam"
              symbol="ANTAM"
              category="gold"
              size="sm"
              className="size-6 rounded-md"
            />
            <div className="text-left">
              <div className="text-[9px] font-semibold text-amber-500 uppercase">Emas Antam (1g)</div>
              <div className="text-xs font-bold font-mono text-foreground">
                {gold ? formatIDR(gold.antamPrice1g) : "Rp 2.722.000"}
              </div>
            </div>
          </div>

          {/* USD/IDR */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/40 shrink-0">
            <AssetLogo
              logoUrl="https://flagcdn.com/w80/us.png"
              name="USD"
              symbol="USDIDR=X"
              category="currency"
              size="sm"
              className="size-6 rounded-md"
            />
            <div className="text-left">
              <div className="text-[9px] font-semibold text-emerald-500 uppercase">USD / IDR</div>
              <div className="text-xs font-bold font-mono text-foreground">
                {usd?.price ? formatIDR(usd.price) : "Rp 17.875"}
              </div>
            </div>
          </div>

          {/* BBCA */}
          {bbca && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/40 shrink-0">
              <AssetLogo
                logoUrl="/logos/bbca.svg"
                name="BBCA"
                symbol="BBCA.JK"
                category="indo_stock"
                size="sm"
                className="size-6 rounded-md"
              />
              <div className="text-left">
                <div className="text-[9px] font-semibold text-blue-500 uppercase">BBCA.JK</div>
                <div className="text-xs font-bold font-mono text-foreground flex items-center gap-1">
                  <span>{formatIDR(bbca.price)}</span>
                  <span
                    className={cn(
                      "text-[9px]",
                      bbca.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {bbca.changePercent >= 0 ? "+" : ""}
                    {bbca.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AAPL */}
          {aapl && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/40 shrink-0">
              <AssetLogo
                logoUrl="/logos/aapl.svg"
                name="AAPL"
                symbol="AAPL"
                category="world_stock"
                size="sm"
                className="size-6 rounded-md"
              />
              <div className="text-left">
                <div className="text-[9px] font-semibold text-purple-500 uppercase">AAPL</div>
                <div className="text-xs font-bold font-mono text-foreground flex items-center gap-1">
                  <span>${aapl.price.toFixed(1)}</span>
                  <span
                    className={cn(
                      "text-[9px]",
                      aapl.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {aapl.changePercent >= 0 ? "+" : ""}
                    {aapl.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Link */}
        <Link
          to="/investments?tab=market"
          className="shrink-0 flex items-center gap-1 text-xs font-bold text-accent hover:text-accent/80 transition-colors self-end sm:self-center"
        >
          <span>{isId ? "Lihat Pasar Lengkap" : "View Market"}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}
