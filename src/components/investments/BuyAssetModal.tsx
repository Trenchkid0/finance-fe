import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, TrendingUp, X } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/FormSelect";
import { CustomSingleDatePicker } from "@/components/ui/CustomSingleDatePicker";

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

export function BuyAssetModal({
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
