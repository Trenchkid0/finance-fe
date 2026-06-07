"use client";

import { useState, useTransition } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

import { api } from "@/lib/api";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TransactionForm,
  type AccountOption,
  type CategoryOption,
  type TransactionFormInitial,
} from "./TransactionForm";
import {
  InlineCategoryPicker,
  TransferBadge,
} from "./InlineCategoryPicker";

export interface TransactionRowData {
  id: string;
  type: "income" | "expense" | "transfer";
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  transferToId: string | null;
  transferToName: string | null;
  amount: number;
  date: string;
  description: string | null;
  note: string | null;
}

export interface TransactionFiltersState {
  q: string;
  type: "all" | "income" | "expense" | "transfer";
  accountId: string;
  categoryId: string;
  /** YYYY-MM-DD; empty string means "no filter". */
  startDate: string;
  endDate: string;
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  total: number;
  totalPages: number;
}

export interface TransactionSummary {
  total: number;
  income: number;
  expense: number;
}

interface Props {
  transactions: TransactionRowData[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  filters: TransactionFiltersState;
  pagination: TransactionPagination;
  summary: TransactionSummary;
  /** True kalau DEEPSEEK_API_KEY ter-set di server. */
  aiScanEnabled: boolean;
}

export function TransactionsClient({
  transactions,
  accounts,
  categories,
  filters,
  pagination,
  summary,
  aiScanEnabled,
}: Props) {
  const { t, language } = useLanguage();
  const [editing, setEditing] = useState<TransactionRowData | null>(null);
  const [creating, setCreating] = useState<TransactionFormInitial | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionRowData | null>(null);
  const [searchParams] = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [pendingBulk, startTransitionBulk] = useTransition();

  const canCreate = accounts.length > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allIdsOnPage = transactions.map((t) => t.id);
  const isAllSelected =
    allIdsOnPage.length > 0 && allIdsOnPage.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIdsOnPage.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIdsOnPage.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    startTransitionBulk(async () => {
      try {
        const ids = Array.from(selectedIds);
        await api.delete<any>("/api/transactions", { ids });
        toast.success(`${ids.length} transaksi berhasil dihapus`);
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
        window.dispatchEvent(new CustomEvent("refresh-app-data"));
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus transaksi.");
      }
    });
  };

  function startCreate() {
    setCreating(blankInitial(accounts[0]?.id ?? ""));
  }

  function startDuplicate(row: TransactionRowData) {
    // Pre-fill semua field tapi reset tanggal ke hari ini supaya
    // duplikasi cocok untuk skenario "bayar Netflix tiap bulan".
    setCreating({
      type: row.type,
      accountId: row.accountId,
      categoryId: row.categoryId,
      transferToId: row.transferToId,
      amount: row.amount,
      date: todayLocalISO(),
      description: row.description ?? "",
      note: row.note ?? "",
    });
  }

  function exportHref(): string {
    const qs = searchParams.toString();
    return qs ? `/api/transactions/export?${qs}` : "/api/transactions/export";
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {t("transactionsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {t("transactionsSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-xl gap-2 text-xs font-semibold px-4" title={language === "id" ? "Unduh CSV" : "Download CSV"}>
            <a href={exportHref()} download>
              <Download size={14} />
              {t("export")}
            </a>
          </Button>
          <Button
            onClick={startCreate}
            disabled={!canCreate}
            className="h-9 rounded-xl gap-2 text-xs font-semibold px-4"
            title={canCreate ? undefined : (language === "id" ? "Tambahkan akun terlebih dahulu" : "Add an account first")}
          >
            <Plus size={14} strokeWidth={2.5} />
            {t("addTransaction")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("totalTransactions")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-foreground">
            {summary.total} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "transaksi" : "transactions"}</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("incomeLabel")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-income">
            {formatIDR(summary.income)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("expenseLabel")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-expense">
            {formatIDR(summary.expense)}
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        accounts={accounts}
        categories={categories}
      />

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-expense/10 border border-expense/20 animate-fade-in text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-expense">
              {selectedIds.size} {t("selectedCount")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              {t("cancelButton")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
              className="bg-expense hover:bg-red-600 text-white text-xs font-semibold gap-1.5 h-8 px-3 rounded-lg"
            >
              <Trash2 size={13} />
              {t("deleteSelected")}
            </Button>
          </div>
        </div>
      )}

      <TransactionsList
        transactions={transactions}
        categories={categories}
        onEdit={setEditing}
        onDelete={setConfirmDelete}
        onDuplicate={startDuplicate}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        isAllSelected={isAllSelected}
        toggleSelectAll={toggleSelectAll}
        emptyState={
          isFilterActive(filters) ? (
            <EmptyState
              icon={Search}
              title={language === "id" ? "Tidak ada transaksi cocok" : "No matching transactions"}
              description={language === "id" ? "Coba ubah kata kunci atau reset filter." : "Try changing keyword or resetting filters."}
              size="sm"
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title={language === "id" ? "Belum ada transaksi" : "No transactions yet"}
              description={
                canCreate
                  ? (language === "id" ? "Catat transaksi pertama Anda untuk mulai melacak arus kas." : "Record your first transaction to start tracking cash flow.")
                  : (language === "id" ? "Tambahkan akun terlebih dahulu untuk mencatat transaksi." : "Add an account first to record transactions.")
              }
              action={
                canCreate ? (
                  <Button size="sm" onClick={startCreate}>
                    <Plus size={12} />
                    {t("addTransaction")}
                  </Button>
                ) : null
              }
              size="sm"
            />
          )
        }
      />

      <PaginationBar pagination={pagination} />

      {/* Create / Duplicate */}
      <Dialog
        open={creating !== null}
        onOpenChange={(open) => !open && setCreating(null)}
      >
        <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{language === "id" ? "Tambah transaksi" : "Add transaction"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {creating ? (
              <TransactionForm
                mode="create"
                initial={creating}
                accounts={accounts}
                categories={categories}
                aiScanEnabled={aiScanEnabled}
                onSuccess={() => setCreating(null)}
                onCancel={() => setCreating(null)}
              />
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{language === "id" ? "Ubah transaksi" : "Edit transaction"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {editing ? (
              <TransactionForm
                mode="edit"
                initial={toFormInitial(editing)}
                accounts={accounts}
                categories={categories}
                onSuccess={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />

      {/* Confirm Bulk Delete */}
      <Dialog
        open={confirmBulkDelete}
        onOpenChange={(open) => !open && setConfirmBulkDelete(false)}
      >
        <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-base font-bold">{t("confirmBulkTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-text-muted">
              {language === "id"
                ? `Apakah Anda yakin ingin menghapus ${selectedIds.size} transaksi terpilih? Tindakan ini tidak dapat dibatalkan dan saldo akun terkait akan disesuaikan kembali secara otomatis.`
                : `Are you sure you want to delete ${selectedIds.size} selected transactions? This action cannot be undone and corresponding account balances will be adjusted automatically.`}
            </p>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmBulkDelete(false)}
                className="text-xs h-9 px-4 rounded-xl"
              >
                {t("cancelButton")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pendingBulk}
                onClick={handleBulkDelete}
                className="bg-expense hover:bg-red-600 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
              >
                {pendingBulk && <Loader2 className="h-3 w-3 animate-spin" />}
                {language === "id" ? "Hapus" : "Delete"}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- URL-state helpers ---------------------------------------------------

/**
 * Build a new search-param string from the current one + a partial
 * patch. `null`/`undefined` removes the key. Always resets `page` to 1
 * when any filter (other than page itself) changes.
 */
function withParams(
  current: URLSearchParams,
  patch: Record<string, string | null | undefined>,
): string {
  const next = new URLSearchParams(current);
  let changedNonPage = false;

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== "page" && key !== "pageSize") changedNonPage = true;
  }
  // Reset page when filter changes unless caller explicitly set page.
  if (changedNonPage && !("page" in patch)) {
    next.delete("page");
  }
  return next.toString();
}

// --- Filter bar ----------------------------------------------------------

function FilterBar({
  filters,
  accounts,
  categories,
}: {
  filters: TransactionFiltersState;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pushFilter(patch: Record<string, string | null | undefined>) {
    const qs = withParams(searchParams, patch);
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  const active = isFilterActive(filters);

  return (
    <form
      action=""
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        pushFilter({
          q: (fd.get("q") as string) ?? "",
          startDate: (fd.get("startDate") as string) || null,
          endDate: (fd.get("endDate") as string) || null,
        });
      }}
      className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Cari deskripsi atau catatan..."
            className="pl-9"
            aria-label="Cari transaksi"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:flex lg:items-center">
          <FilterSelect
            label="Tipe"
            value={filters.type}
            onChange={(v) => pushFilter({ type: v })}
            options={[
              { value: "all", label: "Semua tipe" },
              { value: "income", label: "Pemasukan" },
              { value: "expense", label: "Pengeluaran" },
              { value: "transfer", label: "Transfer" },
            ]}
          />
          <FilterSelect
            label="Akun"
            value={filters.accountId}
            onChange={(v) => pushFilter({ accountId: v })}
            options={[
              { value: "all", label: "Semua akun" },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <FilterSelect
            label="Kategori"
            value={filters.categoryId}
            onChange={(v) => pushFilter({ categoryId: v })}
            options={[
              { value: "all", label: "Semua kategori" },
              { value: "none", label: "Tanpa kategori" },
              ...categories.map((c) => ({
                value: c.id,
                label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Date range + actions row */}
      <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold text-text-muted shrink-0">Rentang Tanggal</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="date"
              name="startDate"
              defaultValue={filters.startDate}
              max={filters.endDate || undefined}
              className="h-8 text-xs w-36 bg-elevated"
              aria-label="Tanggal mulai"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <Input
              type="date"
              name="endDate"
              defaultValue={filters.endDate}
              min={filters.startDate || undefined}
              className="h-8 text-xs w-36 bg-elevated"
              aria-label="Tanggal akhir"
            />
          </div>
          <DateRangePresets
            onPick={(range) =>
              pushFilter({
                startDate: range.start,
                endDate: range.end,
              })
            }
          />
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          {active ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                pushFilter({
                  q: null,
                  type: null,
                  accountId: null,
                  categoryId: null,
                  startDate: null,
                  endDate: null,
                })
              }
            >
              Reset
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            Terapkan Filter
          </Button>
        </div>
      </div>
    </form>
  );
}

// --- Date range presets --------------------------------------------------

interface DateRange {
  start: string;
  end: string;
}

function DateRangePresets({ onPick }: { onPick: (r: DateRange) => void }) {
  const today = new Date();
  const isoToday = isoFromDate(today);

  function preset(label: string, range: DateRange) {
    return (
      <button
        key={label}
        type="button"
        onClick={() => onPick(range)}
        className="text-[10px] px-2.5 py-1 rounded-full bg-elevated border border-border/80 text-text-muted hover:text-text-primary hover:bg-[#2D333B] hover:border-[#444C56] transition-all duration-150 font-medium"
      >
        {label}
      </button>
    );
  }

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 6);
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 29);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {preset("Hari ini", { start: isoToday, end: isoToday })}
      {preset("7 hari", { start: isoFromDate(last7), end: isoToday })}
      {preset("30 hari", { start: isoFromDate(last30), end: isoToday })}
      {preset("Bulan ini", { start: isoFromDate(startOfMonth), end: isoToday })}
      {preset("Bulan lalu", {
        start: isoFromDate(startOfPrevMonth),
        end: isoFromDate(endOfPrevMonth),
      })}
    </div>
  );
}

function isoFromDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface FilterSelectOption {
  value: string;
  label: string;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterSelectOption[];
}) {
  return (
    <div className="grid gap-1.5 sm:gap-1">
      <Label className="sr-only">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="bg-elevated">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// --- List (grouped by date) ---------------------------------------------

/**
 * Transaction list — pola Maybe Finance asli.
 *
 *   ┌─ MAY 16, 2026 · 2 ───────────── -Rp 310.000 ─┐
 *   │ ┌────────────────────────────────────────┐  │
 *   │ │ ⓣ Top Up Shopeepay  [Shopping]   -290k │  │
 *   │ │   BNI                                  │  │
 *   │ ├────────────────────────────────────────┤  │
 *   │ │ ⓑ Bakmi Resto Rio   [Food]       -20k │  │
 *   │ │   Jago                                 │  │
 *   │ └────────────────────────────────────────┘  │
 *   └─────────────────────────────────────────────┘
 *
 * Group total mempermudah scanning harian — user langsung lihat hari
 * mana paling boros tanpa harus jumlahkan sendiri.
 */
function TransactionsList({
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
}: {
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
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {emptyState}
      </div>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="space-y-4">
      {/* Column header — desktop only */}
      <div className="hidden md:grid grid-cols-12 px-5 py-1 text-[10px] uppercase font-semibold text-text-muted tracking-wider items-center gap-3">
        <div className="col-span-7 flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3.5 w-3.5 transition-all duration-200 cursor-pointer"
          />
          <span>Rincian Transaksi</span>
        </div>
        <span className="col-span-3">Kategori</span>
        <span className="col-span-2 text-right">Jumlah</span>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <DateGroup
            key={group.date}
            group={group}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface TransactionGroup {
  date: string;
  label: string;
  total: number;
  items: TransactionRowData[];
}

function groupByDate(rows: TransactionRowData[]): TransactionGroup[] {
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
    ordered.push({
      date: key,
      label: formatGroupDate(key),
      total: items.reduce((sum, t) => sum + signedAmount(t), 0),
      items,
    });
  }
  return ordered;
}

function signedAmount(tx: TransactionRowData): number {
  if (tx.type === "income") return tx.amount;
  if (tx.type === "expense") return -tx.amount;
  return 0; // transfer netral terhadap net worth
}

function formatGroupDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DateGroup({
  group,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  selectedIds,
  toggleSelect,
}: {
  group: TransactionGroup;
  categories: CategoryOption[];
  onEdit: (row: TransactionRowData) => void;
  onDelete: (row: TransactionRowData) => void;
  onDuplicate: (row: TransactionRowData) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
}) {
  const totalColor =
    group.total > 0
      ? "text-income"
      : group.total < 0
        ? "text-expense font-bold"
        : "text-foreground";

  const isGroupAllSelected = group.items.every((item) => selectedIds.has(item.id));
  const toggleGroupSelect = () => {
    if (isGroupAllSelected) {
      group.items.forEach((item) => {
        if (selectedIds.has(item.id)) {
          toggleSelect(item.id);
        }
      });
    } else {
      group.items.forEach((item) => {
        if (!selectedIds.has(item.id)) {
          toggleSelect(item.id);
        }
      });
    }
  };

  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between px-2 text-xs font-semibold text-text-muted">
        <div className="flex items-center gap-2 uppercase tracking-wider text-[10px]">
          <input
            type="checkbox"
            checked={isGroupAllSelected}
            onChange={toggleGroupSelect}
            className="rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3 w-3 transition-all duration-200 cursor-pointer mr-1"
          />
          <span>{group.label}</span>
          <span className="text-text-muted/30">·</span>
          <span className="font-mono tabular-nums bg-elevated border border-border/85 px-1.5 py-0.2 rounded text-[9px] text-text-muted font-medium">
            {group.items.length} transaksi
          </span>
        </div>
        <p className={`font-mono tabular-nums ${totalColor}`}>
          {group.total > 0 ? "+" : ""}
          {formatIDR(group.total)}
        </p>
      </header>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
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
      </div>
    </section>
  );
}

function TransactionRow({
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
  const { language } = useLanguage();
  const initial =
    (tx.description ?? tx.categoryName ?? "T").trim().charAt(0).toUpperCase() ||
    "T";

  const getRowTypeInfo = (type: "income" | "expense" | "transfer") => {
    switch (type) {
      case "income":
        return "bg-income/10 border-income/25 text-income";
      case "expense":
        return "bg-expense/10 border-expense/25 text-expense";
      case "transfer":
        return "bg-accent/10 border-accent/25 text-accent";
    }
  };

  return (
    <div className={cn(
      "grid grid-cols-12 items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 group",
      isSelected ? "bg-accent/5" : "hover:bg-elevated/30"
    )}>
      {/* Avatar + checkbox + description + account (col-span 7) */}
      <div className="col-span-12 md:col-span-7 flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-white/20 bg-white/[0.04] text-accent focus:ring-accent/50 focus:ring-offset-canvas h-3.5 w-3.5 transition-all duration-200 cursor-pointer shrink-0"
        />
        <span className={cn(
          "size-8 rounded-lg border flex items-center justify-center text-[10px] font-bold uppercase shrink-0 font-mono transition-colors",
          getRowTypeInfo(tx.type)
        )}>
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-text-primary font-medium truncate text-[13px]">
            {tx.description ?? tx.categoryName ?? "Transaksi"}
          </p>
          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {tx.type === "transfer" ? (
              <span className="inline-flex items-center gap-1">
                <ArrowLeftRight size={10} />
                Transfer · {tx.accountName} → {tx.transferToName ?? "?"}
              </span>
            ) : (
              tx.accountName
            )}
          </p>
        </div>
      </div>

      {/* Category badge (col-span 3) — klik untuk re-categorize */}
      <div className="hidden md:flex md:col-span-3 items-center min-w-0">
        {tx.type === "transfer" ? (
          <TransferBadge transferToName={tx.transferToName} />
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

      {/* Amount + actions (col-span 2) */}
      <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1.5">
        <p
          className={`font-mono tabular-nums text-[13px] font-bold whitespace-nowrap ${amountClass(tx.type)}`}
        >
          {amountPrefix(tx.type)}
          {formatIDR(tx.amount)}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Opsi transaksi"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-white/[0.12] active:bg-white/[0.18] text-text-muted hover:text-text-primary transition-all duration-150 focus:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-white/[0.08] data-[state=open]:text-text-primary data-[state=open]:hover:bg-white/[0.12]"
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(tx)}>
              <Pencil size={12} />
              {language === "id" ? "Ubah" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(tx)}>
              <Copy size={12} />
              {language === "id" ? "Duplikasi" : "Duplicate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(tx)}
              variant="destructive"
            >
              <Trash2 size={12} />
              {language === "id" ? "Hapus" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function amountClass(type: "income" | "expense" | "transfer"): string {
  if (type === "income") return "text-income";
  if (type === "expense") return "text-expense";
  return "text-foreground";
}

function amountPrefix(type: "income" | "expense" | "transfer"): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}

// --- Pagination ----------------------------------------------------------

function PaginationBar({
  pagination,
}: {
  pagination: TransactionPagination;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();

  const { page, pageSize, pageSizeOptions, total, totalPages } = pagination;

  function go(targetPage: number) {
    const qs = withParams(searchParams, { page: String(targetPage) });
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  function setSize(newSize: string) {
    const qs = withParams(searchParams, {
      pageSize: newSize === String(25) ? null : newSize,
      page: null,
    });
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
      <p className="tabular-nums">
        Menampilkan{" "}
        <span className="text-foreground font-medium">{start}</span>–
        <span className="text-foreground font-medium">{end}</span> dari{" "}
        <span className="text-foreground font-medium">{total}</span> transaksi
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Per halaman</span>
          <Select value={String(pageSize)} onValueChange={setSize}>
            <SelectTrigger className="h-8 w-20" aria-label="Baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(1)}
            disabled={pending || page <= 1}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(page - 1)}
            disabled={pending || page <= 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-2 text-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(page + 1)}
            disabled={pending || page >= totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(totalPages)}
            disabled={pending || page >= totalPages}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Empty state — handled inline via the `emptyState` prop using the
// shared `EmptyState` primitive from `@/components/ui/empty-state`. ----

// --- Delete confirmation -------------------------------------------------

function ConfirmDelete({
  target,
  onClose,
}: {
  target: TransactionRowData | null;
  onClose: () => void;
}) {
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
          <DialogTitle>{language === "id" ? "Hapus transaksi" : "Delete transaction"}</DialogTitle>
          <DialogDescription>
            {target?.type === "transfer"
              ? (language === "id" ? "Saldo akun sumber dan akun tujuan akan dikoreksi otomatis." : "Source and target account balances will be corrected automatically.")
              : (language === "id" ? "Saldo akun akan disesuaikan otomatis." : "Account balance will be adjusted automatically.")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {target ? (
            <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <p className="text-sm text-foreground">
                {target.description ?? target.categoryName ?? (language === "id" ? "Transaksi" : "Transaction")}
              </p>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">
                {formatIDR(target.amount)} · {formatDateShort(target.date)}
              </p>
            </div>
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
            {pending ? (language === "id" ? "Menghapus..." : "Deleting...") : (language === "id" ? "Hapus" : "Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Helpers -------------------------------------------------------------

function isFilterActive(f: TransactionFiltersState): boolean {
  return (
    f.q.length > 0 ||
    f.type !== "all" ||
    f.accountId !== "all" ||
    f.categoryId !== "all" ||
    f.startDate !== "" ||
    f.endDate !== ""
  );
}

function blankInitial(firstAccountId: string): TransactionFormInitial {
  return {
    type: "expense",
    accountId: firstAccountId,
    categoryId: null,
    transferToId: null,
    amount: 0,
    date: todayLocalISO(),
    description: "",
    note: "",
  };
}

function toFormInitial(row: TransactionRowData): TransactionFormInitial {
  return {
    id: row.id,
    type: row.type,
    accountId: row.accountId,
    categoryId: row.categoryId,
    transferToId: row.transferToId,
    amount: row.amount,
    date: row.date.slice(0, 10),
    description: row.description ?? "",
    note: row.note ?? "",
  };
}

function todayLocalISO(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
