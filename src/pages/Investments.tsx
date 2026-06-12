import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { toast } from "sonner";
import {
  Plus,
  Briefcase,
  TrendingUp,
  MinusCircle,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssetHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isId ? "Gagal membeli aset" : "Failed to purchase asset"));
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
      const payload = {
        holdingId: selectedHolding.id,
        quantity: sellQty,
        price: parseFloat(sellForm.price),
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isId ? "Gagal menjual aset" : "Failed to sell asset"));
    }
  };

  const handleUpdatePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding || !updatePriceValue) return;

    try {
      const payload = {
        holdingId: selectedHolding.id,
        currentPrice: parseFloat(updatePriceValue),
      };

      await api.post("/api/investments/update-price", payload);
      toast.success(isId ? "Harga aset berhasil diperbarui!" : "Asset price updated successfully!");
      setIsUpdatePriceOpen(false);
      setUpdatePriceValue("");
      setSelectedHolding(null);
      fetchHoldings();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isId ? "Gagal memperbarui harga" : "Failed to update price"));
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

      {/* Holdings List Card */}
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
              onClick={() => setIsBuyModalOpen(true)}
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
                            onClick={() => {
                              setSelectedHolding(h);
                              setUpdatePriceValue(String(h.currentPrice));
                              setIsUpdatePriceOpen(true);
                            }}
                            className="p-1.5 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
                            title={isId ? "Perbarui Harga" : "Update Price"}
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHolding(h);
                              setSellForm({
                                quantity: String(h.quantity),
                                price: String(h.currentPrice),
                                addToAccountId: "none",
                              });
                              setIsSellModalOpen(true);
                            }}
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

      {/* ================= BUY ASSET MODAL (Portal-based, following TransactionForm style) ================= */}
      <BuyAssetModal
        open={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        accounts={accounts}
        buyForm={buyForm}
        setBuyForm={setBuyForm}
        onSubmit={handleBuySubmit}
      />

      {/* ================= SELL ASSET DIALOG ================= */}
      <Dialog open={isSellModalOpen} onOpenChange={setIsSellModalOpen}>
        <DialogContent className="bg-elevated border-border text-foreground">
          <DialogHeader>
            <DialogTitle>
              {isId ? `Jual Sebagian / Seluruh ${selectedHolding?.symbol}` : `Sell ${selectedHolding?.symbol}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isId
                ? `Kepemilikan aktif saat ini: ${selectedHolding?.quantity} unit.`
                : `Currently holding ${selectedHolding?.quantity} units.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSellSubmit} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sell-quantity" className="text-xs font-bold text-muted-foreground/75 uppercase tracking-wider">
                  {isId ? "Jumlah Dijual" : "Quantity to Sell"}
                </Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  step="any"
                  max={selectedHolding?.quantity}
                  value={sellForm.quantity}
                  onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sell-price" className="text-xs font-bold text-muted-foreground/75 uppercase tracking-wider">
                  {isId ? "Harga Jual per Unit" : "Sale Price per Unit"}
                </Label>
                <Input
                  id="sell-price"
                  type="number"
                  step="any"
                  value={sellForm.price}
                  onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-border/50 pt-3 mt-3">
              <Label htmlFor="sell-add" className="text-xs font-bold text-muted-foreground/75 uppercase tracking-wider">
                {isId ? "Tambahkan Dana Ke Rekening (Opsional)" : "Deposit Proceeds To (Optional)"}
              </Label>
              <select
                id="sell-add"
                value={sellForm.addToAccountId}
                onChange={(e) => setSellForm({ ...sellForm, addToAccountId: e.target.value })}
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="none">{isId ? "-- Tidak, Catat Pengurangan Aset Saja --" : "-- No, just decrease holding --"}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatIDR(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsSellModalOpen(false);
                  setSelectedHolding(null);
                }}
                className="h-9 rounded-xl text-xs font-semibold"
              >
                {isId ? "Batal" : "Cancel"}
              </Button>
              <Button type="submit" className="h-9 rounded-xl text-xs font-semibold px-4 bg-expense hover:bg-red-600 text-white border-0">
                {isId ? "Catat Penjualan" : "Record Sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= UPDATE PRICE DIALOG ================= */}
      <Dialog open={isUpdatePriceOpen} onOpenChange={setIsUpdatePriceOpen}>
        <DialogContent className="bg-elevated border-border text-foreground">
          <DialogHeader>
            <DialogTitle>
              {isId ? `Perbarui Harga Pasar ${selectedHolding?.symbol}` : `Update Market Price: ${selectedHolding?.symbol}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isId ? "Masukan harga terkini dari bursa/pasar keuangan." : "Enter the latest price quote from market indices."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePriceSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="update-price-input" className="text-xs font-bold text-muted-foreground/75 uppercase tracking-wider">
                {isId ? "Harga per Unit Sekarang (IDR)" : "Current Price per Unit (IDR)"}
              </Label>
              <Input
                id="update-price-input"
                type="number"
                step="any"
                value={updatePriceValue}
                onChange={(e) => setUpdatePriceValue(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsUpdatePriceOpen(false);
                  setSelectedHolding(null);
                }}
                className="h-9 rounded-xl text-xs font-semibold"
              >
                {isId ? "Batal" : "Cancel"}
              </Button>
              <Button type="submit" className="h-9 rounded-xl text-xs font-semibold px-4">
                {isId ? "Perbarui Harga" : "Update Price"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= BUY ASSET MODAL COMPONENT =================
interface BuyAssetModalProps {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; balance: number }[];
  buyForm: {
    accountId: string;
    symbol: string;
    name: string;
    quantity: string;
    price: string;
    deductFromAccountId: string;
    date: string;
    note: string;
  };
  setBuyForm: React.Dispatch<
    React.SetStateAction<{
      accountId: string;
      symbol: string;
      name: string;
      quantity: string;
      price: string;
      deductFromAccountId: string;
      date: string;
      note: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
}

function BuyAssetModal({
  open,
  onClose,
  accounts,
  buyForm,
  setBuyForm,
  onSubmit,
}: BuyAssetModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

  // Calculate total investment
  const qty = parseFloat(buyForm.quantity) || 0;
  const priceNum = parseFloat(buyForm.price.replace(/\D/g, "")) || 0;
  const totalInvest = qty * priceNum;

  useEffect(() => {
    if (!open) return;
    setBuyForm((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, setBuyForm]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl">
        {/* STICKY HEADER */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {isId ? "Beli / Catat Aset Baru" : "Buy / Record Asset"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Catat transaksi pembelian instrumen investasi Anda."
                : "Record a purchase transaction for your investment portfolio."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label={isId ? "Tutup" : "Close"}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <form onSubmit={onSubmit} className="space-y-[18px]">
            {/* Akun Portfolio */}
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Simpan di Akun Portfolio" : "Holding Account"}</Label>
              <FormSelect
                value={buyForm.accountId}
                onChange={(v) => setBuyForm((prev) => ({ ...prev, accountId: v }))}
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatIDR(a.balance)})` }))}
                placeholder={isId ? "Pilih akun" : "Select account"}
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Tanggal Beli" : "Purchase Date"}</Label>
              <CustomSingleDatePicker
                value={buyForm.date}
                onChange={(v) => setBuyForm((prev) => ({ ...prev, date: v }))}
              />
            </div>

            {/* Simbol + Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label className={labelCls}>{isId ? "Simbol Aset" : "Asset Symbol"}</Label>
                <Input
                  value={buyForm.symbol}
                  onChange={(e) => setBuyForm((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g. BBCA, AAPL, BTC"
                  className="h-11 uppercase font-semibold tracking-wider"
                />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}>{isId ? "Nama Lengkap Aset" : "Asset Full Name"}</Label>
                <Input
                  value={buyForm.name}
                  onChange={(e) => setBuyForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Bank Central Asia"
                  className="h-11"
                />
              </div>
            </div>

            {/* Kuantitas + Harga */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label className={labelCls}>{isId ? "Kuantitas (Unit)" : "Quantity"}</Label>
                <Input
                  inputMode="decimal"
                  value={buyForm.quantity}
                  onChange={(e) => setBuyForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0.00"
                  className="h-11 font-mono font-semibold"
                />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}>{isId ? "Harga Beli per Unit" : "Price per Unit"}</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">Rp</span>
                  <Input
                    inputMode="numeric"
                    value={buyForm.price}
                    onChange={(e) => setBuyForm((prev) => ({ ...prev, price: formatInputRupiah(e.target.value) }))}
                    placeholder="0"
                    className="h-11 pl-10 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Total Nilai */}
            {qty > 0 && priceNum > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? "Total Nilai Investasi" : "Total Investment Value"}
                </span>
                <span className="text-sm font-black font-mono text-foreground">{formatIDR(totalInvest)}</span>
              </div>
            )}

            {/* Catatan */}
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Catatan (opsional)" : "Note (optional)"}</Label>
              <Textarea
                value={buyForm.note}
                onChange={(e) => setBuyForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={isId ? "Tambahkan catatan…" : "Add a note…"}
                className="min-h-[70px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              />
            </div>

            {/* Potong Saldo */}
            <div className="space-y-2.5">
              <Label className={labelCls}>
                {isId ? "Potong Saldo Rekening (Opsional)" : "Deduct Funds From (Optional)"}
              </Label>
              <FormSelect
                value={buyForm.deductFromAccountId}
                onChange={(v) => setBuyForm((prev) => ({ ...prev, deductFromAccountId: v }))}
                options={[
                  { value: "none", label: isId ? "-- Tidak, Catat Aset Saja --" : "-- No, just record holding --" },
                  ...accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatIDR(a.balance)})` })),
                ]}
                placeholder={isId ? "Pilih rekening" : "Select account"}
              />
            </div>
          </form>
        </div>

        {/* STICKY FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-7 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 text-[13px]"
          >
            {isId ? "Batal" : "Cancel"}
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            className="h-10 gap-1.5 text-[13px]"
          >
            <Check className="h-4 w-4" />
            {isId ? "Simpan Aset" : "Save Purchase"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ================= FORM SELECT COMPONENT =================
interface FormSelectOption {
  value: string;
  label: string;
}

function FormSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FormSelectOption[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? placeholder;

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 250;
      const popupWidth = triggerRect.width;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top = triggerRect.bottom + 8;

      if (spaceBelow < popupHeight + 10 && spaceAbove > spaceBelow) {
        top = triggerRect.top - popupHeight - 8;
      }

      top = Math.max(10, Math.min(top, window.innerHeight - popupHeight - 10));

      let left = triggerRect.left;
      if (left + popupWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popupWidth - 10);
      }

      containerRef.current.style.top = `${top}px`;
      containerRef.current.style.left = `${left}px`;
      containerRef.current.style.width = `${popupWidth}px`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 ease-out text-left"
      >
        <span className={value ? "" : "text-muted-foreground/50"}>{selectedLabel}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            borderRadius: "12px",
          }}
          className="p-1 border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col text-text-primary shadow-2xl z-[100000] max-h-[300px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-4 text-xs font-semibold outline-none transition-colors duration-200 text-left hover:bg-white/[0.06] ${
                opt.value === value ? "bg-white/[0.04] text-foreground font-semibold" : "text-muted-foreground"
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ================= CUSTOM SINGLE DATE PICKER =================
function CustomSingleDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() => {
    const currentYear = value ? new Date(value).getFullYear() : new Date().getFullYear();
    return Math.floor(currentYear / 16) * 16;
  });

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 320;
      const popupWidth = 280;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top = triggerRect.bottom + 8;

      if (spaceBelow < popupHeight + 10 && spaceAbove > spaceBelow) {
        top = triggerRect.top - popupHeight - 8;
      }

      top = Math.max(10, Math.min(top, window.innerHeight - popupHeight - 10));

      let left = triggerRect.left;
      if (left + popupWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popupWidth - 10);
      }
      if (left < 10) {
        left = 10;
      }

      containerRef.current.style.top = `${top}px`;
      containerRef.current.style.left = `${left}px`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      const contentEl = document.getElementById("single-date-picker-content-invest");
      if (contentEl && contentEl.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  useEffect(() => {
    const vYear = viewDate.getFullYear();
    setYearPageStart(Math.floor(vYear / 16) * 16);
  }, [viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  let startOffset = new Date(year, month, 1).getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev - 16);
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev + 16);
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatFriendlyDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const label = value ? formatFriendlyDate(value) : (language === "id" ? "Pilih Tanggal" : "Select Date");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 ease-out"
      >
        <span>{label}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            id="single-date-picker-content-invest"
            style={{ position: "fixed", top: "0", left: "0" }}
            className="p-4 w-[280px] rounded-2xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col gap-3.5 text-text-primary shadow-2xl z-[99999]"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                {viewMode === "years" ? (
                  <span className="px-1.5 py-0.5 text-xs font-bold text-text-primary font-mono">
                    {yearPageStart} — {yearPageStart + 15}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode(viewMode === "months" ? "days" : "months");
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors",
                        viewMode === "months" && "bg-white/[0.08] text-accent hover:text-accent"
                      )}
                    >
                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month].substring(0, 3)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode("years");
                      }}
                      className="px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors font-mono"
                    >
                      {year}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={viewMode === "months"}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={viewMode === "months"}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {viewMode === "days" && (
              <>
                <div className="grid grid-cols-7 text-center">
                  {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, idx) => (
                    <span key={idx} className="text-[9px] font-bold text-text-muted uppercase">{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-mono">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="h-7 w-7" />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = value === dateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={(e) => handleDayClick(day, e)}
                        className={cn(
                          "h-8 w-8 text-xs rounded-lg flex items-center justify-center font-semibold transition-all cursor-pointer",
                          isSelected ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : isToday ? "border border-accent/50 text-accent font-bold" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-2 py-1">
                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, mIdx) => (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(year, mIdx, 1));
                      setViewMode("days");
                    }}
                    className={cn("h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center", mIdx === month ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]")}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {viewMode === "years" && (
              <div className="grid grid-cols-4 gap-2 py-1">
                {Array.from({ length: 16 }, (_, i) => yearPageStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(y, month, 1));
                      setViewMode("months");
                    }}
                    className={cn("h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center font-mono", y === year ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]")}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-white/[0.06]" />

            <div className="flex items-center justify-between gap-1.5">
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={value}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(val);
                  const parseD = new Date(val);
                  if (!isNaN(parseD.getTime())) setViewDate(parseD);
                }}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all font-mono"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
