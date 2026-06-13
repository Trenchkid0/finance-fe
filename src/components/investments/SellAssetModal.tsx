import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, MinusCircle, X } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/FormSelect";
import type { AssetHolding } from "./types";

interface SellAssetModalProps {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; balance: number }[];
  selectedHolding: AssetHolding | null;
  sellForm: {
    quantity: string;
    price: string;
    addToAccountId: string;
  };
  setSellForm: React.Dispatch<
    React.SetStateAction<{
      quantity: string;
      price: string;
      addToAccountId: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
}

export function SellAssetModal({
  open,
  onClose,
  accounts,
  selectedHolding,
  sellForm,
  setSellForm,
  onSubmit,
}: SellAssetModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

  // Calculate total proceeds
  const qty = parseFloat(sellForm.quantity) || 0;
  const priceNum = parseFloat(sellForm.price.replace(/\D/g, "")) || 0;
  const totalProceeds = qty * priceNum;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-48px)] w-full max-w-[500px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl">
        {/* STICKY HEADER */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-expense to-expense/60 text-white shadow-lg">
            <MinusCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {isId ? `Jual ${selectedHolding?.symbol}` : `Sell Asset: ${selectedHolding?.symbol}`}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? `Kepemilikan aktif saat ini: ${selectedHolding?.quantity} unit.`
                : `Currently holding ${selectedHolding?.quantity} units.`}
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
            {/* Kuantitas Jual */}
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Jumlah Dijual" : "Quantity to Sell"}</Label>
              <Input
                inputMode="decimal"
                type="number"
                step="any"
                max={selectedHolding?.quantity}
                value={sellForm.quantity}
                onChange={(e) => setSellForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="0.00"
                className="h-11 font-mono font-semibold"
              />
            </div>

            {/* Harga Jual per Unit */}
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Harga Jual per Unit" : "Sale Price per Unit"}</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">Rp</span>
                <Input
                  inputMode="numeric"
                  value={sellForm.price}
                  onChange={(e) => setSellForm((prev) => ({ ...prev, price: formatInputRupiah(e.target.value) }))}
                  placeholder="0"
                  className="h-11 pl-10 font-mono font-semibold"
                />
              </div>
            </div>

            {/* Total Penerimaan */}
            {qty > 0 && priceNum > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? "Total Penerimaan Penjualan" : "Total Sale Proceeds"}
                </span>
                <span className="text-sm font-black font-mono text-foreground">{formatIDR(totalProceeds)}</span>
              </div>
            )}

            {/* Tambahkan ke Rekening */}
            <div className="space-y-2.5">
              <Label className={labelCls}>
                {isId ? "Tambahkan Dana Ke Rekening (Opsional)" : "Deposit Proceeds To (Optional)"}
              </Label>
              <FormSelect
                value={sellForm.addToAccountId}
                onChange={(v) => setSellForm((prev) => ({ ...prev, addToAccountId: v }))}
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
            className="h-10 gap-1.5 text-[13px] bg-expense hover:bg-red-600 text-white border-0"
          >
            <Check className="h-4 w-4" />
            {isId ? "Catat Penjualan" : "Record Sale"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
