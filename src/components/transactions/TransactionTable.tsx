import { useEffect, useRef, useState, memo } from "react";
import { ArrowLeftRight, Copy, MoreHorizontal, Pencil, Receipt, Trash2, Wallet } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { normalizeImageUrl } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineCategoryPicker } from "./InlineCategoryPicker";
import { ReceiptPreview } from "./ReceiptPreview";
import type { TransactionRowData, TransactionFiltersState } from "./TransactionsClient";
import type { CategoryOption } from "./TransactionForm";

interface TransactionsListProps {
  transactions: TransactionRowData[];
  categories: CategoryOption[];
  onEdit: (row: TransactionRowData) => void;
  onDelete: (row: TransactionRowData) => void;
  onDuplicate: (row: TransactionRowData) => void;
  emptyState: React.ReactNode;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  filters?: TransactionFiltersState;
}

export function TransactionsList({
  transactions,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  emptyState,
  selectedIds,
  toggleSelect,
  isAllSelected,
  toggleSelectAll,
  filters,
}: TransactionsListProps) {
  const { t, language } = useLanguage();

  if (transactions.length === 0) {
    return <Card className="gap-0">{emptyState}</Card>;
  }

  const groups = groupByDate(transactions, language);

  return (
    <div className="space-y-3">
      {/* Select-all bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface/50 border border-border/50">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3.5 w-3.5 cursor-pointer"
          />
          <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
            {language === "id" ? "Pilih semua di halaman ini" : "Select all on this page"}
          </span>
        </label>
        <span className="text-[10px] font-semibold text-text-muted/50 tracking-wider tabular-nums bg-elevated/60 px-2.5 py-1 rounded-md border border-border/40">
          {transactions.length} {t("transactionCount")}
        </span>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.date}
            style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}
          >
            <DateGroup
              group={group}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
              filters={filters}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TransactionGroup {
  date: string;
  label: string;
  weekday: string;
  relative: string | null;
  income: number;
  expense: number;
  net: number;
  items: TransactionRowData[];
}

function groupByDate(
  rows: TransactionRowData[],
  language: "id" | "en",
): TransactionGroup[] {
  const buckets = new Map<string, TransactionRowData[]>();
  for (const tx of rows) {
    const key = tx.date.slice(0, 10);
    const list = buckets.get(key) ?? [];
    list.push(tx);
    buckets.set(key, list);
  }

  const seen = new Set<string>();
  const ordered: TransactionGroup[] = [];
  for (const tx of rows) {
    const key = tx.date.slice(0, 10);
    if (seen.has(key)) continue;
    seen.add(key);
    const items = buckets.get(key)!;

    const income = items
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = items
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const { label, weekday, relative } = formatGroupDateInfo(key, language);

    ordered.push({
      date: key,
      label,
      weekday,
      relative,
      income,
      expense,
      net: income - expense,
      items,
    });
  }
  return ordered;
}

function formatGroupDateInfo(iso: string, language: "id" | "en") {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86_400_000);

  const locale = language === "id" ? "id-ID" : "en-US";
  const label = d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });

  let relative: string | null = null;
  if (diffDays === 0) relative = language === "id" ? "Hari Ini" : "Today";
  else if (diffDays === 1) relative = language === "id" ? "Kemarin" : "Yesterday";

  return { label, weekday, relative };
}

const DateGroup = memo(function DateGroup({
  group,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  selectedIds,
  toggleSelect,
  filters,
}: {
  group: TransactionGroup;
  categories: CategoryOption[];
  onEdit: (row: TransactionRowData) => void;
  onDelete: (row: TransactionRowData) => void;
  onDuplicate: (row: TransactionRowData) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  filters?: TransactionFiltersState;
}) {
  const { t, language } = useLanguage();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const isGroupAllSelected = group.items.every((item) => selectedIds.has(item.id));
  const someSelected = group.items.some((item) => selectedIds.has(item.id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected && !isGroupAllSelected;
    }
  }, [someSelected, isGroupAllSelected]);

  const toggleGroupSelect = () => {
    if (isGroupAllSelected) {
      group.items.forEach((item) => selectedIds.has(item.id) && toggleSelect(item.id));
    } else {
      group.items.forEach((item) => !selectedIds.has(item.id) && toggleSelect(item.id));
    }
  };

  const isInFilterRange = (() => {
    if (!filters?.startDate && !filters?.endDate) return false;
    const groupDate = new Date(group.date);
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (start && end) return groupDate >= start && groupDate <= end;
    if (start) return groupDate >= start;
    if (end) return groupDate <= end;
    return false;
  })();

  const netColor =
    group.net > 0 ? "text-income" : group.net < 0 ? "text-expense" : "text-text-primary";

  return (
    <section className="space-y-1.5">
      <header
        className={cn(
          "sticky top-0 z-20 flex items-center justify-between gap-3 px-3 py-2 rounded-xl border backdrop-blur-md transition-colors",
          isInFilterRange
            ? "bg-accent/[0.07] border-accent/25"
            : "bg-surface/85 border-white/[0.05]",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <input
            ref={headerCheckboxRef}
            type="checkbox"
            checked={isGroupAllSelected}
            onChange={toggleGroupSelect}
            className="rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3.5 w-3.5 cursor-pointer shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {group.relative && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded">
                  {group.relative}
                </span>
              )}
              {isInFilterRange && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-accent bg-accent/15 border border-accent/25 px-1.5 py-0.5 rounded">
                  {language === "id" ? "Filter" : "Filtered"}
                </span>
              )}
              <span className="text-xs font-bold text-text-primary truncate">
                {group.label}
              </span>
            </div>
            <span className="text-[10px] text-text-muted/70 font-medium truncate">
              {group.weekday} · {group.items.length} {t("transactionCount")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {group.income > 0 && (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[8px] uppercase tracking-wider text-text-muted/50 font-bold">
                {language === "id" ? "Masuk" : "Income"}
              </span>
              <span className="text-[11px] font-mono font-bold text-income tabular-nums">
                +{formatIDR(group.income)}
              </span>
            </div>
          )}
          {group.expense > 0 && (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[8px] uppercase tracking-wider text-text-muted/50 font-bold">
                {language === "id" ? "Keluar" : "Expense"}
              </span>
              <span className="text-[11px] font-mono font-bold text-expense tabular-nums">
                -{formatIDR(group.expense)}
              </span>
            </div>
          )}
          <div className="flex flex-col items-end leading-tight border-l border-white/[0.08] pl-3">
            <span className="text-[8px] uppercase tracking-wider text-text-muted/50 font-bold">
              Net
            </span>
            <span className={cn("text-xs font-mono font-bold tabular-nums", netColor)}>
              {group.net > 0 ? "+" : ""}
              {formatIDR(group.net)}
            </span>
          </div>
        </div>
      </header>

      <Card
        className={cn(
          "divide-y divide-white/[0.04] overflow-hidden gap-0 p-0",
          isInFilterRange && "border-accent/20",
        )}
      >
        {group.items.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            isSelected={selectedIds.has(tx.id)}
            onToggleSelect={() => toggleSelect(tx.id)}
          />
        ))}
      </Card>
    </section>
  );
});

const TransactionRow = memo(function TransactionRow({
  tx,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  isSelected,
  onToggleSelect,
}: {
  tx: TransactionRowData;
  categories: CategoryOption[];
  onEdit: (row: TransactionRowData) => void;
  onDelete: (row: TransactionRowData) => void;
  onDuplicate: (row: TransactionRowData) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const { t, language } = useLanguage();
  const [showReceipt, setShowReceipt] = useState(false);
  const initial =
    (tx.description ?? tx.categoryName ?? "T").trim().charAt(0).toUpperCase() || "T";

  const style = {
    income: { bar: "bg-income", chip: "bg-income/10 border-income/25 text-income", amount: "text-income" },
    expense: { bar: "bg-expense", chip: "bg-expense/10 border-expense/25 text-expense", amount: "text-expense" },
    transfer: { bar: "bg-accent", chip: "bg-accent/10 border-accent/25 text-accent", amount: "text-text-primary" },
  }[tx.type];

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 pl-4 pr-3 py-2.5 transition-colors duration-150 group/row",
        isSelected ? "bg-accent/[0.06]" : "hover:bg-elevated/40",
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className={cn(
          "rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3.5 w-3.5 cursor-pointer shrink-0 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100",
        )}
      />

      <div
        className={cn(
          "size-9 rounded-xl border flex items-center justify-center text-sm font-bold uppercase shrink-0 font-mono transition-transform duration-200 group-hover/row:scale-105",
          style.chip,
        )}
      >
        {tx.type === "transfer" ? <ArrowLeftRight size={15} /> : tx.categoryIcon || initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
            {tx.description ||
              (tx.type === "transfer"
                ? t("transferFund")
                : t("noDescription"))}
          </p>
          {tx.receiptImageUrl && (
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              title={t("viewReceipt")}
              className="shrink-0 text-text-muted/50 hover:text-accent transition-colors"
            >
              <Receipt size={12} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[11px] text-text-muted/80 min-w-0">
          <span className="flex items-center gap-1">
            <Wallet size={10} className="opacity-60 shrink-0" />
            <span className="truncate max-w-[120px]">{tx.accountName}</span>
          </span>
          {tx.type === "transfer" && tx.transferToName && (
            <>
              <ArrowLeftRight size={9} className="opacity-50 shrink-0" />
              <span className="truncate max-w-[120px]">{tx.transferToName}</span>
            </>
          )}
          {tx.type !== "transfer" && tx.categoryName && (
            <span className="md:hidden flex items-center gap-1">
              <span className="text-text-muted/30 shrink-0">·</span>
              <span className="truncate max-w-[100px]">{tx.categoryName}</span>
            </span>
          )}
          {tx.note && (
            <>
              <span className="text-text-muted/30 shrink-0">·</span>
              <span className="truncate italic max-w-[140px]" title={tx.note}>
                {tx.note}
              </span>
            </>
          )}
          {tx.adminFee > 0 && (
            <>
              <span className="text-text-muted/30 shrink-0">·</span>
              <span className="text-expense/90 font-semibold font-mono text-[9px] bg-expense/10 border border-expense/20 px-1 py-0.5 rounded flex items-center">
                Fee: {formatIDR(tx.adminFee)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center shrink-0 w-[150px] justify-end">
        {tx.type === "transfer" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/5 border border-accent/15 text-accent text-[11px] font-medium">
            <ArrowLeftRight size={11} />
            {t("transferLabel")}
          </span>
        ) : (
          <InlineCategoryPicker
            transactionId={tx.id}
            type={tx.type}
            categoryId={tx.categoryId}
            categoryName={tx.categoryName}
            categoryIcon={tx.categoryIcon}
            categories={categories}
          />
        )}
      </div>

      <p
        className={cn(
          "font-mono tabular-nums text-xs sm:text-sm font-bold whitespace-nowrap text-right min-w-[70px] sm:min-w-[96px] shrink-0",
          style.amount,
        )}
      >
        {amountPrefix(tx.type)}
        {formatIDR(tx.amount)}
      </p>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={language === "id" ? "Opsi transaksi" : "Transaction options"}
            className="h-8 w-8 shrink-0 text-text-muted hover:text-text-primary hover:bg-white/[0.12] transition-all duration-150 opacity-60 group-hover/row:opacity-100 flex items-center justify-center border border-transparent hover:border-white/[0.15]"
            style={{ borderRadius: 'var(--dropdown-radius, 8px)' }}
          >
            <MoreHorizontal size={15} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-surface border-border shadow-xl z-[99999]">
          <DropdownMenuItem onSelect={() => onEdit(tx)} className="gap-2">
            <Pencil size={13} />
            {t("editOption")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDuplicate(tx)} className="gap-2">
            <Copy size={13} />
            {t("duplicateOption")}
          </DropdownMenuItem>
          {tx.receiptImageUrl && (
            <DropdownMenuItem onSelect={() => setShowReceipt(true)} className="gap-2">
              <Receipt size={13} />
              {t("viewReceipt")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onDelete(tx)} variant="destructive" className="gap-2">
            <Trash2 size={13} />
            {t("deleteOption")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Receipt Preview Modal */}
      {showReceipt && tx.receiptImageUrl && (
        <ReceiptPreview
          imageUrl={normalizeImageUrl(tx.receiptImageUrl) ?? tx.receiptImageUrl}
          transactionDescription={tx.description || tx.categoryName || undefined}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
});

function amountPrefix(type: "income" | "expense" | "transfer"): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}
