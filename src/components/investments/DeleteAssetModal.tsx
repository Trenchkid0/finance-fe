import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, X } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AssetHolding } from "./types";

interface DeleteAssetModalProps {
  open: boolean;
  onClose: () => void;
  selectedHolding: AssetHolding | null;
  deletingPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function DeleteAssetModal({
  open,
  onClose,
  selectedHolding,
  deletingPending,
  onSubmit,
}: DeleteAssetModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";

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
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {isId ? `Hapus ${selectedHolding?.symbol}` : `Delete Asset: ${selectedHolding?.symbol}`}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Tindakan ini akan menghapus aset ini secara permanen dari portofolio Anda."
                : "This will permanently remove this asset from your portfolio."}
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
          {selectedHolding && (
            <div className="space-y-4">
              <Card className="p-4 gap-0 bg-white/[0.02] border-white/[0.06]">
                <p className="text-sm font-semibold text-foreground">
                  {selectedHolding.symbol} - {selectedHolding.name}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono tabular-nums">
                  {isId ? "Jumlah Kepemilikan: " : "Owned Quantity: "} {selectedHolding.quantity.toFixed(4)}
                </p>
              </Card>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                {isId
                  ? "Apakah Anda yakin ingin menghapus seluruh kepemilikan investasi ini? Tindakan ini tidak dapat dibatalkan."
                  : "Are you sure you want to delete all holding records for this investment? This action cannot be undone."}
              </p>
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-7 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 text-[13px]"
            disabled={deletingPending}
          >
            {isId ? "Batal" : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            className="h-10 gap-1.5 text-[13px] bg-expense hover:bg-red-600 text-white border-0"
            disabled={deletingPending}
          >
            <Check className="h-4 w-4" />
            {deletingPending
              ? (isId ? "Menghapus..." : "Deleting...")
              : (isId ? "Hapus" : "Delete")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
