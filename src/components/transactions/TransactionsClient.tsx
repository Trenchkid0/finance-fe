import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeftRight, Download, Loader2, Plus, Search, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  TransactionForm,
  type AccountOption,
  type CategoryOption,
  type TransactionFormInitial,
} from "./TransactionForm";
import { ImportCsvModal } from "./ImportCsvModal";
import { TransactionFilters, isFilterActive } from "./TransactionFilters";
import { TransactionsList } from "./TransactionTable";
import { TransactionCalendar } from "./TransactionCalendar";
import { PaginationBar } from "./PaginationBar";
import { ConfirmDelete } from "./ConfirmDelete";

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
  adminFee: number;
  date: string;
  description: string | null;
  note: string | null;
  receiptImageUrl: string | null;
}

export interface TransactionFiltersState {
  q: string;
  type: "all" | "income" | "expense" | "transfer";
  accountId: string;
  categoryId: string;
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
  aiScanEnabled: boolean;
}

function todayLocalISO(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

interface CalendarTransactionItem {
  id: string | number;
  type: "income" | "expense" | "transfer";
  accountId: string;
  account?: { name: string };
  categoryId: string | null;
  category?: { name: string; icon: string | null };
  transferToId: string | null;
  transferTo?: { name: string };
  amount: number | string;
  adminFee: number | string;
  date: string;
  description: string | null;
  note: string | null;
  receiptImageUrl: string | null;
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

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarTransactions, setCalendarTransactions] = useState<TransactionRowData[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (viewMode !== "calendar") return;

    const fetchCalendarData = async () => {
      try {
        setCalendarLoading(true);
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m + 1, 0).getDate();
        const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const params = new URLSearchParams();
        if (filters.q) params.set("search", filters.q);
        if (filters.type && filters.type !== "all") params.set("type", filters.type);
        if (filters.accountId && filters.accountId !== "all") params.set("accountId", filters.accountId);
        if (filters.categoryId && filters.categoryId !== "all") params.set("categoryId", filters.categoryId);
        params.set("startDate", start);
        params.set("endDate", end);
        params.set("limit", "1000");

        const res = await api.get<{ transactions: CalendarTransactionItem[] }>(`/api/transactions?${params.toString()}`);
        const mapped = (res.transactions || []).map((tx) => ({
          id: String(tx.id),
          type: tx.type,
          accountId: tx.accountId,
          accountName: tx.account?.name || "Akun Utama",
          categoryId: tx.categoryId,
          categoryName: tx.category?.name ?? null,
          categoryIcon: tx.category?.icon ?? null,
          transferToId: tx.transferToId,
          transferToName: tx.transferTo?.name ?? null,
          amount: Number(tx.amount),
          adminFee: Number(tx.adminFee || 0),
          date: tx.date,
          description: tx.description,
          note: tx.note,
          receiptImageUrl: tx.receiptImageUrl ?? null,
        }));
        setCalendarTransactions(mapped);
      } catch (err) {
        console.error("Failed to fetch calendar transactions:", err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarData();
  }, [
    viewMode,
    currentDate,
    filters.q,
    filters.type,
    filters.accountId,
    filters.categoryId,
  ]);

  useEffect(() => {
    if (viewMode !== "calendar") return;
    const handleRefresh = () => {
      setCurrentDate((d) => new Date(d.getTime()));
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [viewMode]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [pendingBulk, startTransitionBulk] = useTransition();

  const [openBulkEdit, setOpenBulkEdit] = useState(false);
  const [bulkAccount, setBulkAccount] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [pendingBulkEdit, setPendingBulkEdit] = useState(false);

  const handleBulkEdit = async () => {
    try {
      setPendingBulkEdit(true);
      const ids = Array.from(selectedIds);
      const payload: any = { ids };
      if (bulkAccount) payload.accountId = bulkAccount;
      if (bulkCategory) payload.categoryId = bulkCategory;

      await api.put("/api/transactions/bulk", payload);
      toast.success(
        language === "id"
          ? `Berhasil memperbarui ${ids.length} transaksi`
          : `Successfully updated ${ids.length} transactions`
      );
      setSelectedIds(new Set());
      setOpenBulkEdit(false);
      setBulkAccount("");
      setBulkCategory("");
      window.dispatchEvent(new CustomEvent("refresh-app-data"));
    } catch (err: any) {
      toast.error(err.message || (language === "id" ? "Gagal memperbarui transaksi" : "Failed to update transactions"));
    } finally {
      setPendingBulkEdit(false);
    }
  };

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
        await api.delete<unknown>("/api/transactions", { ids });
        toast.success(
          language === "id"
            ? `${ids.length} transaksi berhasil dihapus`
            : `${ids.length} transactions deleted successfully`,
          {
            action: {
              label: language === "id" ? "Urungkan" : "Undo",
              onClick: async () => {
                try {
                  await api.post("/api/transactions/restore", { ids });
                  toast.success(language === "id" ? "Transaksi dikembalikan" : "Transactions restored");
                  window.dispatchEvent(new CustomEvent("refresh-app-data"));
                } catch (err: any) {
                  toast.error(language === "id" ? "Gagal mengembalikan transaksi" : "Failed to restore transactions");
                }
              }
            }
          }
        );
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
        window.dispatchEvent(new CustomEvent("refresh-app-data"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal menghapus transaksi.";
        toast.error(msg);
      }
    });
  };

  function startCreate() {
    setCreating(blankInitial(accounts[0]?.id ?? ""));
  }

  function startDuplicate(row: TransactionRowData) {
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

  function exportHref(): string {
    const qs = searchParams.toString();
    const base = "/api/transactions/export";
    return qs ? `${base}?${qs}` : base;
  }

  function downloadJSON() {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "transactions.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(language === "id" ? "Berhasil mengekspor JSON" : "Successfully exported JSON");
    } catch {
      toast.error(language === "id" ? "Gagal mengekspor data" : "Failed to export data");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up overflow-visible">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {t("transactionsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {t("transactionsSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-white/[0.02] border border-white/[0.06] rounded-xl p-0.5 gap-0.5 mr-2">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-accent/10 text-accent font-extrabold border border-accent/20"
                  : "text-text-muted hover:text-text-primary border border-transparent"
              )}
            >
              <span>{language === "id" ? "Tabel" : "Table"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                viewMode === "calendar"
                  ? "bg-accent/10 text-accent font-extrabold border border-accent/20"
                  : "text-text-muted hover:text-text-primary border border-transparent"
              )}
            >
              <span>{language === "id" ? "Kalender" : "Calendar"}</span>
            </button>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 border border-border/50 bg-transparent text-foreground hover:bg-white/[0.04] hover:border-border transition-all flex items-center justify-center gap-2 text-xs font-semibold px-4"
                style={{ borderRadius: 'var(--dropdown-radius, 12px)' }}
              >
                <Download size={14} />
                {t("exportImport")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface border-border z-[99999]">
              <DropdownMenuItem asChild>
                <a href={exportHref()} download className="cursor-pointer w-full flex items-center gap-2">
                  <span>CSV Format (Export)</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadJSON} className="cursor-pointer flex items-center gap-2">
                <span>JSON Format (Export)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)} className="cursor-pointer flex items-center gap-2 text-accent focus:text-accent font-semibold">
                <span>Import CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <ArrowLeftRight size={15} className="text-accent" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">{t("totalTransactions")}</p>
          <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
            {summary.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-text-muted mt-1">{t("transactionCount")}</p>
        </Card>
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-income/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-income"><path d="M7.5 12V3M7.5 3L4 6.5M7.5 3L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">{t("incomeLabel")}</p>
          <p className="text-xl font-bold font-mono tabular-nums text-income">
            {formatIDR(summary.income, { compact: true })}
          </p>
          {summary.total > 0 && summary.income > 0 && (
            <p className="text-[11px] text-income/60 mt-1 tabular-nums">
              {((summary.income / (summary.income + summary.expense)) * 100).toFixed(0)}% {language === "id" ? "dari total" : "of total"}
            </p>
          )}
        </Card>
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-expense/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-expense"><path d="M7.5 3V12M7.5 12L4 8.5M7.5 12L11 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">{t("expenseLabel")}</p>
          <p className="text-xl font-bold font-mono tabular-nums text-expense">
            {formatIDR(summary.expense, { compact: true })}
          </p>
          {summary.total > 0 && summary.expense > 0 && (
            <p className="text-[11px] text-expense/60 mt-1 tabular-nums">
              {((summary.expense / (summary.income + summary.expense)) * 100).toFixed(0)}% {language === "id" ? "dari total" : "of total"}
            </p>
          )}
        </Card>
      </div>

      <TransactionFilters
        filters={filters}
        accounts={accounts}
        categories={categories}
      />

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 animate-fade-in text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-accent">
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
              variant="outline"
              size="sm"
              onClick={() => setOpenBulkEdit(true)}
              className="border-border hover:bg-[#2D333B] text-text-primary text-xs font-semibold gap-1.5 h-8 px-3 rounded-lg"
            >
              <Edit3 size={13} />
              {language === "id" ? "Ubah Kategori/Akun" : "Edit Category/Account"}
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

      {viewMode === "table" ? (
        <>
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
            filters={filters}
            emptyState={
              isFilterActive(filters) ? (
                <EmptyState
                  icon={Search}
                  title={t("noMatchingTransactions")}
                  description={t("noMatchingDesc")}
                  size="sm"
                />
              ) : (
                <EmptyState
                  icon={Plus}
                  title={t("noTransactions")}
                  description={
                    canCreate
                      ? t("noTransactionsDesc")
                      : t("addAccountFirst")
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
        </>
      ) : (
        <TransactionCalendar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          calendarTransactions={calendarTransactions}
          calendarLoading={calendarLoading}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          accounts={accounts}
          categories={categories}
          aiScanEnabled={aiScanEnabled}
        />
      )}

      {/* Create / Duplicate modal */}
      {creating && (
        <TransactionForm
          open={creating !== null}
          onClose={() => setCreating(null)}
          mode="create"
          initial={creating}
          accounts={accounts}
          categories={categories}
          aiScanEnabled={aiScanEnabled}
          onSuccess={() => setCreating(null)}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <TransactionForm
          open={editing !== null}
          onClose={() => setEditing(null)}
          mode="edit"
          initial={toFormInitial(editing)}
          accounts={accounts}
          categories={categories}
          aiScanEnabled={aiScanEnabled}
          onSuccess={() => setEditing(null)}
        />
      )}

      {/* Single delete confirmation */}
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

      {/* Confirm Bulk Edit */}
      <Dialog
        open={openBulkEdit}
        onOpenChange={(open) => !open && setOpenBulkEdit(false)}
      >
        <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-base font-bold">
              {language === "id" ? "Ubah Massal Transaksi" : "Bulk Edit Transactions"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-xs text-text-muted">
              {language === "id"
                ? `Ubah kategori atau akun untuk ${selectedIds.size} transaksi terpilih.`
                : `Update category or account for ${selectedIds.size} selected transactions.`}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted block mb-1">
                  {language === "id" ? "Akun" : "Account"}
                </label>
                <select
                  value={bulkAccount}
                  onChange={(e) => setBulkAccount(e.target.value)}
                  className="w-full bg-[#1C2128] border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  <option value="">{language === "id" ? "-- Tetap Sama --" : "-- Keep Same --"}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted block mb-1">
                  {language === "id" ? "Kategori" : "Category"}
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full bg-[#1C2128] border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  <option value="">{language === "id" ? "-- Tetap Sama --" : "-- Keep Same --"}</option>
                  <option value="none">{language === "id" ? "Tanpa Kategori" : "No Category"}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpenBulkEdit(false);
                  setBulkAccount("");
                  setBulkCategory("");
                }}
                className="text-xs h-9 px-4 rounded-xl"
              >
                {t("cancelButton")}
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={pendingBulkEdit || (!bulkAccount && !bulkCategory)}
                onClick={handleBulkEdit}
                className="bg-accent hover:bg-blue-500 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
              >
                {pendingBulkEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                {language === "id" ? "Simpan" : "Save"}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <ImportCsvModal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            window.dispatchEvent(new CustomEvent("refresh-app-data"));
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }}
        />
      )}
    </div>
  );
}
