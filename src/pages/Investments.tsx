import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BuyAssetModal } from "@/components/investments/BuyAssetModal";
import { SellAssetModal } from "@/components/investments/SellAssetModal";
import { UpdateAssetPriceModal } from "@/components/investments/UpdateAssetPriceModal";
import { HoldingsTable } from "@/components/investments/HoldingsTable";
import type { AssetHolding } from "@/components/investments/types";
import { SkeletonInvestments } from "@/components/ui/skeleton-loader";

export default function Investments() {
  const { language } = useLanguage();
  const { accounts } = useApp();
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);

  // Selected asset for selling/updating price
  const [selectedHolding, setSelectedHolding] = useState<AssetHolding | null>(null);

  // Form states
  const [buyForm, setBuyForm] = useState({
    accountId: "",
    symbol: "",
    name: "",
    quantity: "",
    price: "",
    deductFromAccountId: "none",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [sellForm, setSellForm] = useState({
    quantity: "",
    price: "",
    addToAccountId: "none",
  });

  const [updatePriceValue, setUpdatePriceValue] = useState("");

  const isId = language === "id";

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await api.get<AssetHolding[]>("/api/investments");
      setHoldings(data || []);
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  // Calculate Metrics
  const totalMarketValue = holdings.reduce((acc, h) => acc + h.quantity * h.currentPrice, 0);
  const totalCostBasis = holdings.reduce((acc, h) => acc + h.quantity * h.buyPrice, 0);
  const totalPnL = totalMarketValue - totalCostBasis;
  const pnlPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  if (loading && holdings.length === 0) {
    return <SkeletonInvestments />;
  }

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyForm.accountId || !buyForm.symbol || !buyForm.name || !buyForm.quantity || !buyForm.price) {
      toast.error(isId ? "Harap isi semua kolom wajib" : "Please fill in all required fields");
      return;
    }

    try {
      const priceNum = parseFloat(buyForm.price.replace(/\D/g, "")) || 0;

      const payload = {
        accountId: buyForm.accountId,
        symbol: buyForm.symbol.toUpperCase(),
        name: buyForm.name,
        quantity: parseFloat(buyForm.quantity),
        price: priceNum,
        date: buyForm.date,
        note: buyForm.note,
        deductFromAccountId: buyForm.deductFromAccountId === "none" ? null : buyForm.deductFromAccountId,
      };

      await api.post("/api/investments/buy", payload);
      toast.success(isId ? "Aset berhasil dibeli!" : "Asset purchased successfully!");
      setIsBuyModalOpen(false);
      // Reset form
      setBuyForm({
        accountId: accounts[0]?.id || "",
        symbol: "",
        name: "",
        quantity: "",
        price: "",
        deductFromAccountId: "none",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      fetchHoldings();
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: unknown) {
      console.error(err);
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
      toast.error(isId ? "Jumlah penjualan melebihi jumlah kepemilikan" : "Sell quantity exceeds owned quantity");
      return;
    }

    try {
      const priceNum = parseFloat(sellForm.price.replace(/\D/g, "")) || 0;
      const payload = {
        holdingId: selectedHolding.id,
        quantity: sellQty,
        price: priceNum,
        addToAccountId: sellForm.addToAccountId === "none" ? null : sellForm.addToAccountId,
      };

      await api.post("/api/investments/sell", payload);
      toast.success(isId ? "Aset berhasil dijual!" : "Asset sold successfully!");
      setIsSellModalOpen(false);
      setSellForm({
        quantity: "",
        price: "",
        addToAccountId: "none",
      });
      setSelectedHolding(null);
      fetchHoldings();
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal menjual aset" : "Failed to sell asset"));
    }
  };

  const handleUpdatePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding || !updatePriceValue) return;

    try {
      const priceNum = parseFloat(updatePriceValue.replace(/\D/g, "")) || 0;
      const payload = {
        holdingId: selectedHolding.id,
        currentPrice: priceNum,
      };

      await api.post("/api/investments/update-price", payload);
      toast.success(isId ? "Harga aset berhasil diperbarui!" : "Asset price updated successfully!");
      setIsUpdatePriceOpen(false);
      setUpdatePriceValue("");
      setSelectedHolding(null);
      fetchHoldings();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      toast.error(message || (isId ? "Gagal memperbarui harga" : "Failed to update price"));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="text-accent h-7 w-7" />
            {isId ? "Portfolio Investasi & Aset" : "Investment Portfolio"}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {isId
              ? "Pantau kepemilikan saham, reksa dana, obligasi, dan aset kripto Anda."
              : "Track your stocks, mutual funds, bonds, and cryptocurrency holdings."}
          </p>
        </div>
        <Button
          onClick={() => {
            // Pick first account as default if available
            setBuyForm((prev) => ({
              ...prev,
              accountId: accounts[0]?.id || "",
            }));
            setIsBuyModalOpen(true);
          }}
          className="h-9 rounded-xl gap-2 text-xs font-semibold px-4"
        >
          <Plus size={14} strokeWidth={2.5} />
          {isId ? "Beli Aset Baru" : "Buy New Asset"}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {isId ? "NILAI PORTFOLIO SAAT INI" : "CURRENT PORTFOLIO VALUE"}
          </p>
          <p className="text-lg font-black font-mono tabular-nums text-foreground">
            {formatIDR(totalMarketValue)}
          </p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {isId ? "TOTAL MODAL DISETOR" : "TOTAL COST BASIS"}
          </p>
          <p className="text-lg font-black font-mono tabular-nums text-text-muted">
            {formatIDR(totalCostBasis)}
          </p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {isId ? "KEUNTUNGAN / KERUGIAN (UNREALIZED)" : "UNREALIZED PROFIT / LOSS"}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg font-black font-mono tabular-nums ${
                totalPnL >= 0 ? "text-income" : "text-expense"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {formatIDR(totalPnL)}
            </span>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                totalPnL >= 0 ? "text-income" : "text-expense"
              }`}
            >
              ({totalPnL >= 0 ? "+" : ""}
              {pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </Card>
      </div>

      {/* Holdings Table */}
      <HoldingsTable
        holdings={holdings}
        loading={loading}
        onUpdatePriceClick={(h) => {
          setSelectedHolding(h);
          setUpdatePriceValue(formatInputRupiah(String(h.currentPrice)));
          setIsUpdatePriceOpen(true);
        }}
        onSellClick={(h) => {
          setSelectedHolding(h);
          setSellForm({
            quantity: String(h.quantity),
            price: formatInputRupiah(String(h.currentPrice)),
            addToAccountId: "none",
          });
          setIsSellModalOpen(true);
        }}
        onBuyFirstClick={() => setIsBuyModalOpen(true)}
      />

      {/* Modals */}
      <BuyAssetModal
        open={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        accounts={accounts}
        buyForm={buyForm}
        setBuyForm={setBuyForm}
        onSubmit={handleBuySubmit}
      />

      <SellAssetModal
        open={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSelectedHolding(null);
        }}
        accounts={accounts}
        selectedHolding={selectedHolding}
        sellForm={sellForm}
        setSellForm={setSellForm}
        onSubmit={handleSellSubmit}
      />

      <UpdateAssetPriceModal
        open={isUpdatePriceOpen}
        onClose={() => {
          setIsUpdatePriceOpen(false);
          setSelectedHolding(null);
        }}
        selectedHolding={selectedHolding}
        updatePriceValue={updatePriceValue}
        setUpdatePriceValue={setUpdatePriceValue}
        onSubmit={handleUpdatePriceSubmit}
      />
    </div>
  );
}
