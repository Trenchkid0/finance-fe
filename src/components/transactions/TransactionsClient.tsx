"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Calendar,
  ChevronDown,
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
import { Card } from "@/components/ui/card";
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

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarTransactions, setCalendarTransactions] = useState<TransactionRowData[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

        const res = await api.get<any>(`/api/transactions?${params.toString()}`);
        const mapped = (res.transactions || []).map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          accountId: tx.accountId,
          accountName: tx.account?.name || "Akun Utama",
          categoryId: tx.categoryId,
          categoryName: tx.category?.name ?? null,
          categoryIcon: tx.category?.icon ?? null,
          transferToId: tx.transferToId,
          transferToName: tx.transferTo?.name ?? null,
          amount: Number(tx.amount),
          date: tx.date,
          description: tx.description,
          note: tx.note,
        }));
        setCalendarTransactions(mapped);
      } catch (err) {
        console.error("Failed to fetch calendar transactions:", err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarData();
  }, [viewMode, currentDate, filters]);

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

  const monthNamesID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthNamesEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const months = language === "id" ? monthNamesID : monthNamesEN;
  const dayNamesID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dayNamesEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysOfWeek = language === "id" ? dayNamesID : dayNamesEN;

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(y, m - 1, 1));
    setSelectedDay(null);
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(y, m + 1, 1));
    setSelectedDay(null);
  };

  function formatCompactIDR(amount: number): string {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
    if (abs >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
    if (abs >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`;
    return `Rp ${amount}`;
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
              <Button variant="outline" className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
                <Download size={14} />
                {t("export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface border-border">
              <DropdownMenuItem asChild>
                <a href={exportHref()} download className="cursor-pointer w-full flex items-center gap-2">
                  <span>CSV Format</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadJSON} className="cursor-pointer flex items-center gap-2">
                <span>JSON Format</span>
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
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("totalTransactions")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-foreground">
            {summary.total} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "transaksi" : "transactions"}</span>
          </p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("incomeLabel")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-income">
            {formatIDR(summary.income)}
          </p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{t("expenseLabel")}</p>
          <p className="text-lg font-black font-mono tabular-nums text-expense">
            {formatIDR(summary.expense)}
          </p>
        </Card>
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
        </>
      ) : (
        <div className="space-y-6">
          {/* Calendar Card */}
          <Card className="p-5 gap-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="text-accent h-5 w-5" />
                <h3 className="text-base font-bold text-text-primary">
                  {language === "id" ? "Kalender Arus Kas" : "Cash Flow Calendar"}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border bg-elevated hover:bg-[#2D333B]"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold min-w-[120px] text-center font-mono">
                  {months[m]} {y}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border bg-elevated hover:bg-[#2D333B]"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Grid */}
            {calendarLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 border-t border-l border-border rounded-lg overflow-hidden bg-border/40">
                {/* Day of Week Headers */}
                {daysOfWeek.map((dayName) => (
                  <div
                    key={dayName}
                    className="bg-surface/90 py-2.5 text-center text-xs font-bold text-text-muted uppercase tracking-wider border-b border-r border-border"
                  >
                    {dayName}
                  </div>
                ))}

                {/* Day Cells */}
                {(() => {
                  const firstDayIndex = new Date(y, m, 1).getDay();
                  const totalDays = new Date(y, m + 1, 0).getDate();
                  const prevMonthTotalDays = new Date(y, m, 0).getDate();

                  const prevMonthCells = [];
                  for (let i = firstDayIndex - 1; i >= 0; i--) {
                    const dayNum = prevMonthTotalDays - i;
                    const prevM = m === 0 ? 11 : m - 1;
                    const prevY = m === 0 ? y - 1 : y;
                    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    prevMonthCells.push({ dayNum, dateStr, currentMonth: false });
                  }

                  const currentMonthCells = [];
                  for (let i = 1; i <= totalDays; i++) {
                    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
                    currentMonthCells.push({ dayNum: i, dateStr, currentMonth: true });
                  }

                  const allCells = [...prevMonthCells, ...currentMonthCells];
                  const remaining = 42 - allCells.length;
                  for (let i = 1; i <= remaining; i++) {
                    const nextM = m === 11 ? 0 : m + 1;
                    const nextY = m === 11 ? y + 1 : y;
                    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
                    allCells.push({ dayNum: i, dateStr, currentMonth: false });
                  }

                  const calendarMap = calendarTransactions.reduce((acc, tx) => {
                    // Normalize date to YYYY-MM-DD format
                    let dStr = tx.date;
                    if (dStr.includes('T')) {
                      dStr = dStr.split('T')[0];
                    }
                    if (!acc[dStr]) acc[dStr] = { income: 0, expense: 0, count: 0, hasTransfer: false };
                    if (tx.type === "income") acc[dStr].income += tx.amount;
                    else if (tx.type === "expense") acc[dStr].expense += tx.amount;
                    else if (tx.type === "transfer") acc[dStr].hasTransfer = true;
                    acc[dStr].count += 1;
                    return acc;
                  }, {} as Record<string, { income: number; expense: number; count: number; hasTransfer: boolean }>);

                  // Debug: log calendar data
                  console.log('Calendar transactions:', calendarTransactions.length);
                  console.log('Calendar map:', calendarMap);
                  console.log('Sample dates:', Object.keys(calendarMap).slice(0, 5));

                  const todayStr = new Date().toLocaleDateString("sv-SE");

                  return allCells.map((cell, idx) => {
                    const data = calendarMap[cell.dateStr];
                    const isSelected = selectedDay === cell.dateStr;
                    const isToday = cell.dateStr === todayStr;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDay(cell.dateStr)}
                        className={cn(
                          "bg-surface min-h-[75px] p-2 flex flex-col justify-between items-stretch text-left border-b border-r border-border hover:bg-elevated/40 transition-all duration-150 relative group",
                          !cell.currentMonth && "opacity-30 bg-surface/30",
                          isSelected && "ring-2 ring-accent z-10 border-accent bg-accent/[0.05]",
                          data && data.count > 0 && !isSelected && "bg-elevated/20"
                        )}
                      >
                        {/* Left indicator bar - more prominent */}
                        {data && data.count > 0 && (
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 rounded-r transition-all",
                            data.income > data.expense ? "bg-income" :
                            data.expense > data.income ? "bg-expense" :
                            "bg-accent"
                          )} />
                        )}
                        
                        <div className="flex justify-between items-start z-10">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold leading-none",
                              isToday
                                ? "text-white bg-accent px-2 py-1 rounded-md shadow-sm"
                                : cell.currentMonth
                                ? "text-text-primary"
                                : "text-text-muted"
                            )}
                          >
                            {cell.dayNum}
                          </span>
                          
                          {/* Transaction count badge */}
                          {data && data.count > 0 && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                              "bg-accent/20 text-accent border border-accent/30"
                            )}>
                              {data.count}
                            </span>
                          )}
                        </div>

                        {/* Transaction indicators */}
                        {data && data.count > 0 && (
                          <div className="space-y-1 mt-auto">
                            {data.income > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="size-1.5 rounded-full bg-income flex-shrink-0" />
                                <div className="text-[9px] font-mono tabular-nums text-income font-bold truncate">
                                  +{formatCompactIDR(data.income)}
                                </div>
                              </div>
                            )}
                            {data.expense > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="size-1.5 rounded-full bg-expense flex-shrink-0" />
                                <div className="text-[9px] font-mono tabular-nums text-expense font-bold truncate">
                                  -{formatCompactIDR(data.expense)}
                                </div>
                              </div>
                            )}
                            {data.hasTransfer && !data.income && !data.expense && (
                              <div className="flex items-center gap-1">
                                <div className="size-1.5 rounded-full bg-accent flex-shrink-0" />
                                <div className="text-[9px] font-mono text-accent font-bold">
                                  Transfer
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </Card>

          {/* Daily Detail Card */}
          {selectedDay && (() => {
            const dayTxs = calendarTransactions.filter((tx) => tx.date.slice(0, 10) === selectedDay);
            const dateParts = selectedDay.split("-");
            const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            const formattedDate = language === "id"
              ? `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`
              : `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

            return (
              <Card className="p-5 space-y-4 animate-fade-in gap-0">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-sm font-bold text-text-primary">
                    {language === "id" ? `Transaksi Pada ${formattedDate}` : `Transactions on ${formattedDate}`}
                  </h4>
                  <span className="text-xs font-mono bg-elevated border border-border px-2.5 py-0.5 rounded-lg text-text-muted">
                    {dayTxs.length} {language === "id" ? "Transaksi" : "Transactions"}
                  </span>
                </div>

                {dayTxs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-text-muted">
                    {language === "id"
                      ? "Tidak ada transaksi tercatat pada tanggal ini."
                      : "No transactions recorded on this day."}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {dayTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-elevated/20 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                            tx.type === "income"
                              ? "bg-income/10 text-income border border-income/20"
                              : tx.type === "expense"
                              ? "bg-expense/10 text-expense border border-expense/20"
                              : "bg-accent/10 text-accent border border-accent/20"
                          )}>
                            {tx.type === "transfer" ? <ArrowLeftRight size={14} /> : (tx.categoryIcon || "💰")}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-text-primary leading-tight">
                              {tx.description || (tx.type === "transfer" ? "Transfer Dana" : "Tanpa Deskripsi")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-text-muted">
                                {tx.accountName}
                              </span>
                              {tx.type !== "transfer" && tx.categoryName && (
                                <>
                                  <span className="text-[9px] text-text-muted/40">•</span>
                                  <span className="text-[10px] text-text-muted">
                                    {tx.categoryName}
                                  </span>
                                </>
                              )}
                              {tx.type === "transfer" && tx.transferToName && (
                                <>
                                  <span className="text-[9px] text-text-muted/40">➔</span>
                                  <span className="text-[10px] text-text-muted">
                                    {tx.transferToName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs font-bold font-mono tabular-nums",
                            tx.type === "income"
                              ? "text-income"
                              : tx.type === "expense"
                              ? "text-expense"
                              : "text-text-primary"
                          )}>
                            {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                            {formatIDR(tx.amount)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditing(tx)}
                              className="p-1 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
                              title={language === "id" ? "Ubah" : "Edit"}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(tx)}
                              className="p-1 rounded hover:bg-expense/10 text-text-muted hover:text-expense transition-colors"
                              title={language === "id" ? "Hapus" : "Delete"}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })()}
        </div>
      )}

      {/* Create / Duplicate */}
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

      {/* Edit */}
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
  const formRef = useRef<HTMLFormElement>(null);

  function pushFilter(patch: Record<string, string | null | undefined>) {
    // Read current values of other form fields directly from the form DOM to preserve them
    const fd = formRef.current ? new FormData(formRef.current) : null;
    const currentQ = fd ? (fd.get("q") as string) : filters.q;
    const currentStart = fd ? (fd.get("startDate") as string) : filters.startDate;
    const currentEnd = fd ? (fd.get("endDate") as string) : filters.endDate;

    const mergedPatch = {
      q: currentQ || null,
      startDate: currentStart || null,
      endDate: currentEnd || null,
      ...patch,
    };

    const qs = withParams(searchParams, mergedPatch);
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  const active = isFilterActive(filters);

  return (
    <Card className="p-0">
      <form
        ref={formRef}
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
        className="flex flex-col gap-4 p-5"
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
          <input type="hidden" name="startDate" value={filters.startDate || ""} />
          <input type="hidden" name="endDate" value={filters.endDate || ""} />
          <CustomDateRangePicker
            startDate={filters.startDate || ""}
            endDate={filters.endDate || ""}
            onPick={(range) =>
              pushFilter({
                startDate: range.start || null,
                endDate: range.end || null,
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
    </Card>
  );
}

// --- Date range presets & Period Selection ----------------------------------

interface DateRange {
  start: string;
  end: string;
}

function getDateRangeForPeriod(period: string): DateRange {
  const today = new Date();
  const end = isoFromDate(today);

  switch (period) {
    case "1d":
      return { start: end, end };
    case "7d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { start: isoFromDate(d), end };
    }
    case "30d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { start: isoFromDate(d), end };
    }
    case "90d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 89);
      return { start: isoFromDate(d), end };
    }
    case "ytd": {
      const d = new Date(today.getFullYear(), 0, 1);
      return { start: isoFromDate(d), end };
    }
    case "365d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 364);
      return { start: isoFromDate(d), end };
    }
    case "5y": {
      const d = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      return { start: isoFromDate(d), end };
    }
    default:
      return { start: "", end: "" };
  }
}


function formatFriendlyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function CustomDateRangePicker({
  startDate,
  endDate,
  onPick,
}: {
  startDate: string;
  endDate: string;
  onPick: (range: { start: string; end: string }) => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() => {
    const currentYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    return Math.floor(currentYear / 16) * 16;
  });

  useEffect(() => {
    const vYear = viewDate.getFullYear();
    setYearPageStart(Math.floor(vYear / 16) * 16);
  }, [viewDate]);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  let startOffset = new Date(year, month, 1).getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev - 16);
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev + 16);
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd("");
    } else {
      if (new Date(dateStr) < new Date(tempStart)) {
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const applyPreset = (presetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const range = getDateRangeForPeriod(presetName);
    setTempStart(range.start);
    setTempEnd(range.end);
    onPick(range);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPick({ start: tempStart, end: tempEnd });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStart("");
    setTempEnd("");
    onPick({ start: "", end: "" });
  };

  let label = "Pilih Tanggal";
  if (startDate && endDate) {
    if (startDate === endDate) {
      label = formatFriendlyDate(startDate);
    } else {
      label = `${formatFriendlyDate(startDate)} — ${formatFriendlyDate(endDate)}`;
    }
  } else if (startDate) {
    label = `Mulai ${formatFriendlyDate(startDate)}`;
  } else if (endDate) {
    label = `Sampai ${formatFriendlyDate(endDate)}`;
  } else {
    label = "Semua Waktu";
  }


  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-2 px-3 text-xs font-semibold text-text-primary bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] rounded-lg transition-all"
        >
          <Calendar size={12} className="text-text-muted pointer-events-none" />
          <span>{label}</span>
          <ChevronDown size={12} className="text-text-muted opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="p-4 w-[280px] rounded-xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col gap-3.5 text-text-primary shadow-2xl"
      >
        {/* Presets Grid */}
        <div className="grid grid-cols-3 gap-1">
          {["1d", "7d", "30d", "ytd", "365d", "all"].map((p) => {
            const labels: Record<string, string> = {
              "1d": "Hari Ini",
              "7d": "7 Hari",
              "30d": "30 Hari",
              "ytd": "Tahun Ini",
              "365d": "1 Tahun",
              "all": "Semua",
            };
            return (
              <button
                key={p}
                type="button"
                onClick={(e) => applyPreset(p, e)}
                className="text-[10px] py-1 px-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/[0.12] text-text-muted hover:text-text-primary transition-all font-semibold"
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* Calendar Control Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            {viewMode === "years" ? (
              <span className="px-1.5 py-0.5 text-xs font-bold text-text-primary font-mono">
                {yearPageStart} — {yearPageStart + 15}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode(viewMode === "months" ? "days" : "months");
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors",
                    viewMode === "months" && "bg-white/[0.08] text-accent hover:text-accent"
                  )}
                >
                  {[
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                  ][month].substring(0, 3)}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("years");
                  }}
                  className="px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors font-mono"
                >
                  {year}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewMode === "months"}
              className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewMode === "months"}
              className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* View Grid based on mode */}
        {viewMode === "days" && (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center">
              {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, idx) => (
                <span key={idx} className="text-[9px] font-bold text-text-muted uppercase">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-7 w-7" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelectedStart = tempStart === dateStr;
                const isSelectedEnd = tempEnd === dateStr;
                const isInRange =
                  tempStart &&
                  tempEnd &&
                  new Date(dateStr) > new Date(tempStart) &&
                  new Date(dateStr) < new Date(tempEnd);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={(e) => handleDayClick(day, e)}
                    className={cn(
                      "h-7 w-7 text-xs rounded-lg flex items-center justify-center font-semibold transition-all hover:bg-white/[0.08] hover:text-text-primary",
                      isSelectedStart && "bg-accent text-white font-bold hover:bg-accent",
                      isSelectedEnd && "bg-accent text-white font-bold hover:bg-accent",
                      isInRange && "bg-accent/15 text-accent font-medium rounded-none"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "months" && (
          <div className="grid grid-cols-3 gap-2 py-1 text-center">
            {[
              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
              "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ].map((m, mIdx) => (
              <button
                key={mIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(year, mIdx, 1));
                  setViewMode("days");
                }}
                className={cn(
                  "h-10 text-xs rounded-lg font-semibold transition-all hover:bg-white/[0.08] hover:text-text-primary",
                  mIdx === month && "bg-accent text-white font-bold hover:bg-accent"
                )}
              >
                {m.substring(0, 3)}
              </button>
            ))}
          </div>
        )}

        {viewMode === "years" && (
          <div className="grid grid-cols-4 gap-2 py-1 text-center font-mono">
            {Array.from({ length: 16 }, (_, i) => yearPageStart + i).map((y) => (
              <button
                key={y}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(y, month, 1));
                  setViewMode("months");
                }}
                className={cn(
                  "h-10 text-xs rounded-lg font-semibold transition-all hover:bg-white/[0.08] hover:text-text-primary",
                  y === year && "bg-accent text-white font-bold hover:bg-accent"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-white/[0.06]" />

        {/* Custom Input Form fields */}
        <div className="flex items-center justify-between gap-1.5">
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            value={tempStart}
            onChange={(e) => setTempStart(e.target.value)}
            className="w-[105px] h-7 text-[10px] text-center font-mono px-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="text-text-muted text-[10px]">→</span>
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            value={tempEnd}
            onChange={(e) => setTempEnd(e.target.value)}
            className="w-[105px] h-7 text-[10px] text-center font-mono px-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-1/2 h-7.5 py-1 text-[11px] font-bold rounded-lg border border-white/[0.06] hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-1/2 h-7.5 py-1 text-[11px] font-bold rounded-lg bg-accent text-white hover:bg-accent/80 transition-all"
          >
            Terapkan
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? label;

  return (
    <div className="grid gap-1.5 sm:gap-1">
      <Label className="sr-only">{label}</Label>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none transition-all duration-300 ease-out text-left"
          >
            <span>{selectedLabel}</span>
            <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[150px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              className="text-xs font-semibold cursor-pointer"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
      <Card className="gap-0">
        {emptyState}
      </Card>
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

      <Card className="divide-y divide-white/[0.04] overflow-hidden gap-0">
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
        <DropdownMenu modal={false}>
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-8 w-20 flex items-center justify-between px-2.5 text-xs font-semibold text-text-primary hover:bg-white/[0.04] bg-white/[0.03] border border-white/[0.08] transition-all rounded-lg"
              >
                <span>{pageSize}</span>
                <ChevronDown size={12} className="opacity-60 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[80px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  className="text-xs font-semibold cursor-pointer"
                  onClick={() => setSize(String(size))}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
