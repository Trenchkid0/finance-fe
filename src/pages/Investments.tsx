import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR, formatInputRupiahDecimal, parseLocalizedFloat } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Briefcase, Plus, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { BuyAssetModal } from "@/components/investments/BuyAssetModal";
import { SellAssetModal } from "@/components/investments/SellAssetModal";
import { UpdateAssetPriceModal } from "@/components/investments/UpdateAssetPriceModal";
import { DeleteAssetModal } from "@/components/investments/DeleteAssetModal";
import { HoldingsTable } from "@/components/investments/HoldingsTable";
import type { AssetHolding } from "@/components/investments/types";
import { SkeletonInvestments } from "@/components/ui/skeleton-loader";

export default function Investments() {
  const { language } = useLanguage();
  const { accounts } = useApp();
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [loading, setLoading] = useState(true);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<AssetHolding | null>(null);
  const [deletingHolding, setDeletingHolding] = useState<AssetHolding | null>(null);
  const [deletingPending, setDeletingPending] = useState(false);

  const [buyForm, setBuyForm] = useState({
    accountId: "", type: "stock", symbol: "", name: "",
    quantity: "", price: "", deductFromAccountId: "none",
    date: new Date().toISOString().split("T")[0], note: "",
  });
  const [sellForm, setSellForm] = useState({ quantity: "", price: "", addToAccountId: "none" });
  const [updatePriceValue, setUpdatePriceValue] = useState("");

  const isId = language === "id";

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await api.get<AssetHolding[]>("/api/investments");
      setHoldings(data || []);
    } catch { setHoldings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHoldings(); }, []);

  const totalMarketValue = holdings.reduce((a, h) => a + h.quantity * h.currentPrice, 0);
  const totalCostBasis = holdings.reduce((a, h) => a + h.quantity * h.buyPrice, 0);
  const totalPnL = totalMarketValue - totalCostBasis;
  const pnlPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
  const isProfit = totalPnL >= 0;

  if (loading && holdings.length === 0) return <SkeletonInvestments />;

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const showQty = !["p2p", "property"].includes(buyForm.type);
    if (!buyForm.accountId || !buyForm.symbol || !buyForm.name || (showQty && !buyForm.quantity) || !buyForm.price) {
      toast.error(isId ? "Harap isi semua kolom wajib" : "Please fill in all required fields");
      return;
    }
    try {
      const priceNum = parseLocalizedFloat(buyForm.price);
      await api.post("/api/investments/buy", {
        accountId: buyForm.accountId, type: buyForm.type,
        symbol: buyForm.symbol.toUpperCase(), name: buyForm.name,
        quantity: parseFloat(buyForm.quantity) || 1, price: priceNum,
        date: buyForm.date, note: buyForm.note,
        deductFromAccountId: buyForm.deductFromAccountId === "none" ? null : buyForm.deductFromAccountId,
      });
      toast.success(isId ? "Aset berhasil dibeli!" : "Asset purchased successfully!");
      setIsBuyModalOpen(false);
      setBuyForm({ accountId: accounts[0]?.id || "", type: "stock", symbol: "", name: "", quantity: "", price: "", deductFromAccountId: "none", date: new Date().toISOString().split("T")[0], note: "" });
      fetchHoldings();
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal membeli aset" : "Failed to purchase asset"));
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding || !sellForm.quantity || !sellForm.price) {
      toast.error(isId ? "Harap isi semua kolom wajib" : "Please fill in all required fields");
      return;
    }
    const sellQty = parseFloat(sellForm.quantity);
    if (sellQty > selectedHolding.quantity) {
      toast.error(isId ? "Jumlah penjualan melebihi kepemilikan" : "Sell quantity exceeds owned quantity");
      return;
    }
    try {
      await api.post("/api/investments/sell", {
        holdingId: selectedHolding.id, quantity: sellQty,
        price: parseLocalizedFloat(sellForm.price),
        addToAccountId: sellForm.addToAccountId === "none" ? null : sellForm.addToAccountId,
      });
      toast.success(isId ? "Aset berhasil dijual!" : "Asset sold successfully!");
      setIsSellModalOpen(false);
      setSellForm({ quantity: "", price: "", addToAccountId: "none" });
      setSelectedHolding(null);
      fetchHoldings();
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal menjual aset" : "Failed to sell asset"));
    }
  };

  const handleUpdatePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding || !updatePriceValue) return;
    try {
      await api.post("/api/investments/update-price", {
        holdingId: selectedHolding.id,
        currentPrice: parseLocalizedFloat(updatePriceValue),
      });
      toast.success(isId ? "Harga aset berhasil diperbarui!" : "Asset price updated successfully!");
      setIsUpdatePriceOpen(false);
      setUpdatePriceValue("");
      setSelectedHolding(null);
      fetchHoldings();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal memperbarui harga" : "Failed to update price"));
    }
  };

  const handleDeleteHolding = async () => {
    if (!deletingHolding) return;
    try {
      setDeletingPending(true);
      await api.delete(`/api/investments/${deletingHolding.id}`);
      toast.success(isId ? "Aset berhasil dihapus!" : "Asset deleted successfully!");
      setDeletingHolding(null);
      fetchHoldings();
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal menghapus aset" : "Failed to delete asset"));
    } finally {
      setDeletingPending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Briefcase className="text-accent h-5 w-5" />
            </div>
            {isId ? "Portfolio Investasi & Aset" : "Investment Portfolio"}
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1.5">
            {isId
              ? "Pantau kepemilikan saham, reksa dana, obligasi, dan aset kripto Anda."
              : "Track your stocks, mutual funds, bonds, and cryptocurrency holdings."}
          </p>
        </div>
        <Button
          onClick={() => { setBuyForm((p) => ({ ...p, accountId: accounts[0]?.id || "" })); setIsBuyModalOpen(true); }}
          className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
          <Plus size={14} strokeWidth={2.5} />
          {isId ? "Beli Aset Baru" : "Buy New Asset"}
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Market Value */}
        <Card className="p-4 gap-0 relative overflow-hidden group transition-all duration-300 hover:border-accent/40 hover:shadow-lg">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <BarChart3 size={15} className="text-accent" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">
            {isId ? "Nilai Portfolio" : "Portfolio Value"}
          </p>
          <p className="text-lg font-extrabold font-mono tabular-nums text-foreground">
            {formatIDR(totalMarketValue)}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">
            {isId ? "Harga pasar saat ini" : "Current market price"}
          </p>
        </Card>

        {/* Cost Basis */}
        <Card className="p-4 gap-0 relative overflow-hidden group transition-all duration-300 hover:border-border hover:shadow-lg">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-muted/40 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Wallet size={15} className="text-muted-foreground" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">
            {isId ? "Modal Disetor" : "Cost Basis"}
          </p>
          <p className="text-lg font-extrabold font-mono tabular-nums text-muted-foreground">
            {formatIDR(totalCostBasis)}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">
            {isId ? "Total investasi awal" : "Total initial investment"}
          </p>
        </Card>

        {/* P&L */}
        <Card className={cn(
          "p-4 gap-0 relative overflow-hidden group transition-all duration-300 hover:shadow-lg",
          isProfit ? "hover:border-income/40" : "hover:border-expense/40"
        )}>
          <div className={cn("absolute top-3 right-3 size-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            isProfit ? "bg-income/10" : "bg-expense/10"
          )}>
            {isProfit
              ? <TrendingUp size={15} className="text-income" />
              : <TrendingDown size={15} className="text-expense" />}
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">
            {isId ? "Keuntungan / Kerugian" : "Unrealized P&L"}
          </p>
          <p className={cn("text-lg font-extrabold font-mono tabular-nums", isProfit ? "text-income" : "text-expense")}>
            {totalPnL >= 0 ? "+" : ""}{formatIDR(totalPnL)}
          </p>
          <p className={cn("text-[11px] font-bold font-mono mt-1", isProfit ? "text-income/70" : "text-expense/70")}>
            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
          </p>
        </Card>

        {/* Holdings Count */}
        <Card className="p-4 gap-0 relative overflow-hidden group transition-all duration-300 hover:border-accent/30 hover:shadow-lg">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Briefcase size={15} className="text-accent" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">
            {isId ? "Jumlah Aset" : "Total Holdings"}
          </p>
          <p className="text-lg font-extrabold font-mono tabular-nums text-foreground">
            {holdings.length}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">
            {isId ? "Aset aktif dimiliki" : "Active asset positions"}
          </p>
        </Card>
      </div>

      {/* ── Holdings Table ── */}
      <HoldingsTable
        holdings={holdings} loading={loading}
        onUpdatePriceClick={(h) => {
          setSelectedHolding(h);
          setUpdatePriceValue(formatInputRupiahDecimal(String(h.currentPrice)));
          setIsUpdatePriceOpen(true);
        }}
        onSellClick={(h) => {
          setSelectedHolding(h);
          setSellForm({ quantity: String(h.quantity), price: formatInputRupiahDecimal(String(h.currentPrice)), addToAccountId: "none" });
          setIsSellModalOpen(true);
        }}
        onDeleteClick={(h) => setDeletingHolding(h)}
        onBuyFirstClick={() => setIsBuyModalOpen(true)}
      />

      {/* ── Modals ── */}
      <BuyAssetModal open={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)}
        accounts={accounts} buyForm={buyForm} setBuyForm={setBuyForm} onSubmit={handleBuySubmit} />

      <SellAssetModal open={isSellModalOpen} onClose={() => { setIsSellModalOpen(false); setSelectedHolding(null); }}
        accounts={accounts} selectedHolding={selectedHolding}
        sellForm={sellForm} setSellForm={setSellForm} onSubmit={handleSellSubmit} />

      <UpdateAssetPriceModal open={isUpdatePriceOpen} onClose={() => { setIsUpdatePriceOpen(false); setSelectedHolding(null); }}
        selectedHolding={selectedHolding} updatePriceValue={updatePriceValue}
        setUpdatePriceValue={setUpdatePriceValue} onSubmit={handleUpdatePriceSubmit} />

      <DeleteAssetModal open={deletingHolding !== null} onClose={() => setDeletingHolding(null)}
        selectedHolding={deletingHolding} deletingPending={deletingPending} onSubmit={handleDeleteHolding} />
    </div>
  );
}
