import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TransactionRowData } from "./TransactionsClient";

interface ConfirmDeleteProps {
  target: TransactionRowData | null;
  onClose: () => void;
}

export function ConfirmDelete({
  target,
  onClose,
}: ConfirmDeleteProps) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteTransaction(target.id);
      if (result.ok) {
        toast.success(language === "id" ? "Transaksi berhasil dihapus" : "Transaction deleted successfully");
        onClose();
      } else {
        toast.error(result.error ?? (language === "id" ? "Gagal menghapus transaksi" : "Failed to delete transaction"));
      }
    });
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{t("deleteTransaction")}</DialogTitle>
          <DialogDescription>
            {target?.type === "transfer"
              ? t("deleteTransferDesc")
              : t("deleteTransactionDesc")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {target ? (
            <Card className="px-4 py-3 gap-0">
              <p className="text-sm text-foreground">
                {target.description ?? target.categoryName ?? (language === "id" ? "Transaksi" : "Transaction")}
              </p>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">
                {formatIDR(target.amount)} · {formatDateShort(target.date)}
              </p>
            </Card>
          ) : null}
        </DialogBody>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
