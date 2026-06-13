import { Briefcase, MinusCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AssetHolding } from "./types";

interface HoldingsTableProps {
  holdings: AssetHolding[];
  loading: boolean;
  onUpdatePriceClick: (holding: AssetHolding) => void;
  onSellClick: (holding: AssetHolding) => void;
  onBuyFirstClick: () => void;
}

export function HoldingsTable({
  holdings,
  loading,
  onUpdatePriceClick,
  onSellClick,
  onBuyFirstClick,
}: HoldingsTableProps) {
  const { language } = useLanguage();
  const isId = language === "id";

  return (
    <Card className="p-0 overflow-hidden gap-0">
      <div className="p-4 border-b border-border bg-white/[0.01]">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          {isId ? "Daftar Kepemilikan Aset" : "Asset Holdings"}
        </h3>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted flex justify-center items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          {isId ? "Memuat data kepemilikan..." : "Loading holdings..."}
        </div>
      ) : holdings.length === 0 ? (
        <div className="p-12 text-center text-text-muted space-y-3">
          <Briefcase size={32} className="mx-auto opacity-30 text-accent" />
          <p className="text-xs font-medium">
            {isId ? "Belum ada kepemilikan aset." : "No asset holdings recorded yet."}
          </p>
          <Button
            onClick={onBuyFirstClick}
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-semibold border-border bg-elevated hover:bg-[#2D333B] px-4"
          >
            {isId ? "Beli Aset Pertama" : "Buy First Asset"}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-white/[0.005]">
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider pl-4">
                  {isId ? "Simbol & Nama" : "Symbol & Name"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">
                  {isId ? "Jumlah" : "Quantity"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">
                  {isId ? "Harga Beli Rata-rata" : "Avg Buy Price"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">
                  {isId ? "Harga Saat Ini" : "Current Price"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">
                  {isId ? "Nilai Pasar" : "Market Value"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">
                  {isId ? "Keuntungan (PnL)" : "PnL"}
                </th>
                <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-center pr-4 w-44">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {holdings.map((h) => {
                const marketVal = h.quantity * h.currentPrice;
                const costBasis = h.quantity * h.buyPrice;
                const pnl = marketVal - costBasis;
                const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                return (
                  <tr key={h.id} className="hover:bg-elevated/20 transition-colors duration-150">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-text-primary text-xs">{h.symbol}</div>
                      <div className="text-[10px] text-text-muted truncate max-w-[150px]">{h.name}</div>
                      {h.account && (
                        <div className="text-[9px] text-accent/80 font-mono mt-0.5">{h.account.name}</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-xs text-text-primary">
                      {h.quantity.toFixed(4)}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-xs text-text-muted">
                      {formatIDR(h.buyPrice)}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-xs text-text-primary">
                      {formatIDR(h.currentPrice)}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-xs font-semibold text-text-primary">
                      {formatIDR(marketVal)}
                    </td>
                    <td className={`p-3 text-right font-mono tabular-nums text-xs font-bold ${
                      pnl >= 0 ? "text-income" : "text-expense"
                    }`}>
                      <div>{pnl >= 0 ? "+" : ""}{formatIDR(pnl)}</div>
                      <div className="text-[9px] font-bold opacity-80">({pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</div>
                    </td>
                    <td className="p-3 text-center pr-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onUpdatePriceClick(h)}
                          className="p-1.5 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
                          title={isId ? "Perbarui Harga" : "Update Price"}
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() => onSellClick(h)}
                          className="p-1.5 rounded hover:bg-expense/10 text-text-muted hover:text-expense transition-colors"
                          title={isId ? "Jual Aset" : "Sell Asset"}
                        >
                          <MinusCircle size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
