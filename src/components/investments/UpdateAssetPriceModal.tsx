import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, RefreshCw, X } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatInputRupiah } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetHolding } from "./types";

interface UpdateAssetPriceModalProps {
  open: boolean;
  onClose: () => void;
  selectedHolding: AssetHolding | null;
  updatePriceValue: string;
  setUpdatePriceValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UpdateAssetPriceModal({
  open,
  onClose,
  selectedHolding,
  updatePriceValue,
  setUpdatePriceValue,
  onSubmit,
}: UpdateAssetPriceModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {isId ? `Perbarui Harga ${selectedHolding?.symbol}` : `Update Price: ${selectedHolding?.symbol}`}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Masukkan harga pasar terkini per unit aset."
                : "Enter the latest unit price quote for this holding."}
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
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Harga per Unit Sekarang (IDR)" : "Current Price per Unit (IDR)"}</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">Rp</span>
                <Input
                  inputMode="numeric"
                  value={updatePriceValue}
                  onChange={(e) => setUpdatePriceValue(formatInputRupiah(e.target.value))}
                  placeholder="0"
                  className="h-11 pl-10 font-mono font-semibold"
                />
              </div>
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
            {isId ? "Perbarui Harga" : "Update Price"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
