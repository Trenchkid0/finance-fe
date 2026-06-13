import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { setBudgetLimit } from "@/app/actions/budgets";
import { cleanMoneyString, formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { BudgetCategoryData } from "./BudgetClient";

interface CategoriesListProps {
  categories: (BudgetCategoryData & { color: string })[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const { language } = useLanguage();
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-elevated p-8 text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">
          {language === "id" ? "Belum ada kategori pengeluaran" : "No expense categories yet"}
        </p>
        <p className="text-xs text-text-muted">
          {language === "id"
            ? "Tambahkan kategori dari halaman pengaturan untuk mulai mengatur anggaran."
            : "Add categories from settings page to start budgeting."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {categories.map((cat) => (
        <BudgetCategoryRow key={cat.id} category={cat} />
      ))}
    </div>
  );
}

function BudgetCategoryRow({
  category,
}: {
  category: BudgetCategoryData & { color: string };
}) {
  const { language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draftLimit, setDraftLimit] = useState<string>(
    category.limit !== null ? formatInputRupiah(String(category.limit)) : ""
  );
  const [pending, startTransition] = useTransition();

  const hasLimit = category.limit !== null && category.limit > 0;
  const remaining = hasLimit ? (category.limit ?? 0) - category.spent : 0;
  const isOver = hasLimit && category.spent > (category.limit ?? 0);
  const overage = isOver ? category.spent - (category.limit ?? 0) : 0;

  const percentUsed = hasLimit ? Math.round((category.spent / (category.limit ?? 1)) * 100) : 0;

  function handleSave() {
    const num = Number(cleanMoneyString(draftLimit));
    if (!Number.isFinite(num) || num < 0) {
      toast.error(
        language === "id" ? "Masukkan angka yang valid (≥ 0)." : "Please enter a valid number (≥ 0)."
      );
      return;
    }
    startTransition(async () => {
      const result = await setBudgetLimit(category.id, num);
      if (result.ok) {
        toast.success(
          num > 0
            ? language === "id"
              ? "Batas anggaran tersimpan."
              : "Budget limit saved."
            : language === "id"
              ? "Batas anggaran dihapus."
              : "Budget limit removed."
        );
        setEditing(false);
      } else {
        toast.error(
          result.error ??
            (language === "id"
              ? "Gagal menyimpan batas anggaran."
              : "Failed to save budget limit.")
        );
      }
    });
  }

  return (
    <div className="py-3 px-2 flex items-center justify-between border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors rounded-xl group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Circle color-matched icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]"
          style={{
            backgroundColor: `color-mix(in oklab, ${category.color} 10%, transparent)`,
            color: category.color,
          }}
        >
          <span className="text-xs">{category.icon || "•"}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{category.name}</span>
            {hasLimit && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium",
                  isOver
                    ? "bg-expense/10 text-expense"
                    : percentUsed > 85
                      ? "bg-warning/10 text-warning"
                      : "bg-accent/10 text-accent"
                )}
              >
                {percentUsed}%
              </span>
            )}
          </div>

          {hasLimit ? (
            <div className="flex items-center gap-3">
              <div className="w-24 bg-elevated h-1 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isOver ? "bg-expense" : percentUsed > 85 ? "bg-warning" : "bg-accent"
                  )}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-mono",
                  isOver ? "text-expense" : remaining < 0 ? "text-expense" : "text-text-muted"
                )}
              >
                {isOver
                  ? language === "id"
                    ? `Lebih ${formatIDR(overage)}`
                    : `Over by ${formatIDR(overage)}`
                  : language === "id"
                    ? `${formatIDR(remaining)} sisa`
                    : `${formatIDR(remaining)} remaining`}
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-muted/60">
              {language === "id" ? "Belum ada batas anggaran" : "No budget limit"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-3">
        {editing ? (
          <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-lg p-1">
            <Input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(formatInputRupiah(e.target.value))}
              placeholder="Limit"
              className="h-7 w-20 text-xs font-mono border-0 focus-visible:ring-0 bg-transparent p-1 text-text-primary"
              aria-label={
                language === "id"
                  ? `Batas anggaran ${category.name}`
                  : `Budget limit ${category.name}`
              }
              autoFocus
              disabled={pending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-income hover:bg-income/10 hover:text-income"
              onClick={handleSave}
              disabled={pending}
              aria-label={language === "id" ? "Simpan" : "Save"}
            >
              <Check size={12} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-expense hover:bg-expense/10 hover:text-expense"
              onClick={() => {
                setEditing(false);
                setDraftLimit(
                  category.limit !== null ? formatInputRupiah(String(category.limit)) : ""
                );
              }}
              disabled={pending}
              aria-label={language === "id" ? "Batal" : "Cancel"}
            >
              <X size={12} />
            </Button>
          </div>
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-bold font-mono tabular-nums text-text-primary">
                {formatIDR(category.spent)}
              </p>
              <p className="text-[10px] text-text-muted font-mono">
                {language === "id" ? "dari" : "of"} {hasLimit ? formatIDR(category.limit ?? 0) : "—"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-text-primary hover:bg-elevated transition-all"
              onClick={() => setEditing(true)}
              aria-label={
                language === "id" ? `Atur batas ${category.name}` : `Set limit for ${category.name}`
              }
            >
              <Pencil size={12} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
