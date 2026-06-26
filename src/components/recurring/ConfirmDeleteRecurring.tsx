import { useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { cache, CacheKeys } from "@/lib/cache";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfirmDeleteRecurringProps {
  target: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
  } | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function ConfirmDeleteRecurring({
  target,
  onClose,
  onDeleted,
}: ConfirmDeleteRecurringProps) {
  const { language } = useLanguage();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!target) return;
    startTransition(async () => {
      try {
        await api.delete(`/api/recurring/${target.id}`);
        toast.success(
          language === "id" ? "Tagihan berhasil dihapus" : "Bill deleted successfully"
        );
        cache.delete(CacheKeys.recurring());
        onDeleted();
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(
          language === "id" ? "Gagal menghapus tagihan" : "Failed to delete bill"
        );
      }
    });
  }

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  const freqLabel =
    target.frequency === "monthly"
      ? language === "id" ? "Bulanan" : "Monthly"
      : target.frequency === "weekly"
      ? language === "id" ? "Mingguan" : "Weekly"
      : language === "id" ? "Tahunan" : "Yearly";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-expense to-expense/60 text-white shadow-lg">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {language === "id" ? "Hapus Tagihan Berulang?" : "Delete Recurring Bill?"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {language === "id"
                ? "Tindakan ini permanen dan akan menghentikan pelacakan tagihan rutin ini."
                : "This action is permanent and will stop tracking this recurring bill."}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <Card className="px-4 py-3 gap-0">
            <p className="text-sm font-semibold text-foreground">
              {target.name}
            </p>
            <p className="text-xs text-text-muted mt-1 font-mono tabular-nums">
              {formatIDR(target.amount)} · {freqLabel}
            </p>
          </Card>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border px-7 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={pending}
            className="text-xs h-10 px-5 rounded-xl cursor-pointer"
          >
            {language === "id" ? "Batal" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
            className="bg-expense hover:bg-red-600 text-white text-xs font-semibold h-10 px-5 rounded-xl gap-1.5 cursor-pointer"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            {language === "id" ? "Hapus" : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
