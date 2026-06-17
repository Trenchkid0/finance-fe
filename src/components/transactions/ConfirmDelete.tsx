import { useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { deleteTransaction, restoreTransaction } from "@/app/actions/transactions";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TransactionRowData } from "./TransactionsClient";

interface ConfirmDeleteProps {
  target: TransactionRowData | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

export function ConfirmDelete({
  target,
  onClose,
  onDeleted,
}: ConfirmDeleteProps) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteTransaction(target.id);
      if (result.ok) {
        onDeleted?.(target.id);
        toast.success(
          language === "id" ? "Transaksi berhasil dihapus" : "Transaction deleted successfully",
          {
            action: {
              label: language === "id" ? "⟲ Urungkan" : "⟲ Undo",
              onClick: async () => {
                const restoreRes = await restoreTransaction(target.id);
                if (restoreRes.ok) {
                  toast.success(language === "id" ? "Transaksi dikembalikan" : "Transaction restored");
                } else {
                  toast.error(restoreRes.error || (language === "id" ? "Gagal mengembalikan transaksi" : "Failed to restore transaction"));
                }
              }
            }
          }
        );
        onClose();
      } else {
        toast.error(result.error ?? (language === "id" ? "Gagal menghapus transaksi" : "Failed to delete transaction"));
      }
    });
  }

  // Esc + lock scroll
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
              {t("deleteTransaction")}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {target?.type === "transfer"
                ? t("deleteTransferDesc")
                : t("deleteTransactionDesc")}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <Card className="px-4 py-3 gap-0">
            <p className="text-sm text-foreground">
              {target.description ?? target.categoryName ?? (language === "id" ? "Transaksi" : "Transaction")}
            </p>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatIDR(target.amount)} · {formatDateShort(target.date)}
            </p>
          </Card>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border px-7 py-4">
          <Button variant="secondary" onClick={onClose} disabled={pending} className="rounded-xl">
            {t("cancelButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-xl"
          >
            {pending ? t("deletingLabel") : t("deleteOption")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

