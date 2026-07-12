import { useEffect, useState, useTransition, useMemo, useLayoutEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Inbox,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  MoreVertical,
  MoreHorizontal,
  Search,
  TrendingUp,
  TrendingDown,
  Plus,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  Upload,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SkeletonAnalytics } from "@/components/ui/skeleton-loader";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useApp } from "@/components/layout/AppLayout";
import { AccountForm } from "@/components/accounts/AccountForm";
import { deleteAccount, toggleAccountActive } from "@/app/actions/accounts";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ConfirmDelete as ConfirmDeleteTransaction } from "@/components/transactions/ConfirmDelete";
import { CustomDateRangePicker } from "@/components/transactions/CustomDateRangePicker";
import { ImportStatementModal } from "@/components/transactions/ImportStatementModal";
import { exportToPDF } from "@/lib/utils/pdfExport";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { TransactionApiItem, TransactionsApiResponse } from "@/types";
import type { AccountFormInitial } from "@/components/accounts/AccountForm";
import type { AccountTypeInput } from "@/lib/utils/validators";
import type { TransactionFormInitial } from "@/components/transactions/TransactionForm";
import type { TransactionRowData } from "@/components/transactions/TransactionsClient";

interface AccountDetailData {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  icon?: string;
  color?: string;
}

interface TransactionGroup {
  date: string;
  label: string;
  weekday: string;
  relative: string | null;
  income: number;
  expense: number;
  net: number;
  items: TransactionApiItem[];
}

function CustomSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? label;

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 180;
      
      let top = triggerRect.bottom + 6;
      let left = triggerRect.left;
      let width = triggerRect.width;

      if (top + popupHeight > window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top - popupHeight - 6;
      }

      setPosition({ top, left, width });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      
      let attempts = 0;
      const tryPosition = () => {
        if (containerRef.current && triggerRef.current) {
          updatePosition();
          if (containerRef.current.offsetHeight > 0) return;
        }
        if (attempts < 5) {
          attempts++;
          requestAnimationFrame(tryPosition);
        }
      };
      requestAnimationFrame(tryPosition);

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  return (
    <div className="relative w-full md:w-48">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent transition-all duration-200 text-left rounded-xl"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={12} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: position ? `${position.top}px` : "-9999px",
            left: position ? `${position.left}px` : "-9999px",
            width: position ? `${position.width}px` : "auto",
            visibility: position ? undefined : "hidden",
            borderRadius: "12px",
          }}
          className="p-1 border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col text-text-primary shadow-2xl z-[100000] max-h-[250px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-3 text-xs font-semibold outline-none transition-colors duration-150 text-left hover:bg-white/[0.06] ${
                opt.value === value ? "bg-white/[0.04] text-foreground font-semibold" : "text-muted-foreground"
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function groupByDate(
  rows: TransactionApiItem[],
  language: "id" | "en",
): TransactionGroup[] {
  const buckets = new Map<string, TransactionApiItem[]>();
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

const normalizeColor = (col: string | null | undefined) => {
  if (!col) return "var(--accent)";
  if (col === "#388BFD" || col === "#3B82F6") return "var(--accent)";
  return col;
};

export default function AccountDetail() {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, categories, refresh: refreshGlobal } = useApp();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountDetailData | null>(null);
  const [transactions, setTransactions] = useState<TransactionApiItem[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // Account actions state
  const [editingAccount, setEditingAccount] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccountPending, startDeleteAccountTransition] = useTransition();
  const [togglingAccountPending, startToggleAccountTransition] = useTransition();

  // Transaction actions state
  const [editingTransaction, setEditingTransaction] = useState<TransactionApiItem | null>(null);
  const [creatingTransaction, setCreatingTransaction] = useState<TransactionFormInitial | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionApiItem | null>(null);
  const [importStatementOpen, setImportStatementOpen] = useState(false);

  const accountTypeLabel: Record<string, string> = {
    bank: language === "id" ? "Bank" : "Bank",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    cash: language === "id" ? "Tunai" : "Cash",
    investment: language === "id" ? "Investasi" : "Investment",
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const acc = await api.get<AccountDetailData>(`/api/accounts/${id}`);
      let url = `/api/transactions?accountId=${id}&limit=50`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const txResponse = await api.get<TransactionsApiResponse>(url);
      setAccount(acc);
      setTransactions(txResponse.transactions || []);
      setTotalIncome(txResponse.income || 0);
      setTotalExpense(txResponse.expense || 0);
      setTotalCount(txResponse.total || 0);
    } catch (err) {
      console.error("Failed to fetch account detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, startDate, endDate]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [id, startDate, endDate]);

  // Handle Account deactivation/activation
  const handleToggleActive = () => {
    if (!account) return;
    startToggleAccountTransition(async () => {
      const result = await toggleAccountActive(account.id);
      if (result.ok) {
        toast.success(
          language === "id"
            ? `Status akun berhasil diubah`
            : `Account status updated successfully`
        );
        fetchData();
        refreshGlobal();
      } else {
        toast.error(result.error || (language === "id" ? "Gagal mengubah status aktif akun" : "Failed to toggle account status"));
      }
    });
  };

  // Handle Account delete
  const handleDeleteAccount = () => {
    if (!account) return;
    startDeleteAccountTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.ok) {
        toast.success(
          language === "id"
            ? `Akun "${account.name}" berhasil dihapus`
            : `Account "${account.name}" deleted successfully`
        );
        refreshGlobal();
        navigate("/accounts");
      } else {
        toast.error(result.error || (language === "id" ? "Gagal menghapus akun" : "Failed to delete account"));
      }
    });
  };

  // Filter & Sort Transactions locally for instant response
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((tx) => {
        if (typeFilter === "income") {
          return tx.type === "income" || (tx.type === "transfer" && tx.transferToId === id);
        }
        if (typeFilter === "expense") {
          return tx.type === "expense" || (tx.type === "transfer" && tx.accountId === id);
        }
        if (typeFilter === "transfer") {
          return tx.type === "transfer";
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const descMatch = tx.description?.toLowerCase().includes(q);
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const catMatch = tx.category?.name?.toLowerCase().includes(q);
        return descMatch || noteMatch || catMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [transactions, typeFilter, searchQuery, sortBy, id]);

  // Group by Date for Transactions list
  const groupedTransactions = useMemo(() => {
    return groupByDate(filteredAndSortedTransactions, language);
  }, [filteredAndSortedTransactions, language]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.set("accountId", id || "");
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const csvText = await api.get<string>(`/api/transactions/export?${params.toString()}`);
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `account_${account?.name || "transactions"}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        language === "id"
          ? "Berhasil mengekspor CSV"
          : "Successfully exported CSV"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (language === "id" ? "Gagal mengekspor CSV" : "Failed to export CSV");
      toast.error(msg);
    }
  };

  const handleExportPDF = () => {
    try {
      const dateRangeStr = (startDate || endDate)
        ? `${startDate || "*"} ${language === "id" ? "s/d" : "to"} ${endDate || "*"}`
        : (language === "id" ? "Semua Periode" : "All Time");

      exportToPDF({
        title: language === "id" ? "Laporan Rekening" : "Account Statement",
        accountName: account?.name,
        dateRange: dateRangeStr,
        transactions: filteredAndSortedTransactions.map((t) => ({
          date: t.date,
          description: t.description,
          categoryName: t.category?.name ?? null,
          type: t.type,
          amount: t.amount,
          adminFee: t.adminFee,
          note: t.note,
          transferToName: t.transferTo?.name ?? null,
        })),
        summary: {
          income: totalIncome,
          expense: totalExpense,
          total: totalCount,
        },
        language: language,
      });
      toast.success(language === "id" ? "Berhasil mengekspor PDF" : "Successfully exported PDF");
    } catch (err) {
      console.error(err);
      toast.error(language === "id" ? "Gagal mengekspor PDF" : "Failed to export PDF");
    }
  };

  const toFormInitial = (row: TransactionApiItem): TransactionFormInitial => {
    return {
      id: String(row.id),
      type: row.type,
      accountId: row.accountId,
      categoryId: row.categoryId,
      transferToId: row.transferToId,
      amount: row.amount,
      adminFee: row.adminFee,
      date: row.date.slice(0, 10),
      description: row.description ?? "",
      note: row.note ?? "",
      receiptImageUrl: row.receiptImageUrl,
    };
  };

  const toRowData = (tx: TransactionApiItem): TransactionRowData => {
    return {
      id: String(tx.id),
      type: tx.type,
      accountId: tx.accountId,
      accountName: tx.account?.name || "",
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
      categoryIcon: tx.category?.icon ?? null,
      transferToId: tx.transferToId,
      transferToName: tx.transferTo?.name ?? null,
      amount: tx.amount,
      adminFee: tx.adminFee,
      date: tx.date,
      description: tx.description,
      note: tx.note,
      receiptImageUrl: tx.receiptImageUrl,
    };
  };

  const startCreate = () => {
    if (!account) return;
    setCreatingTransaction({
      type: "expense",
      accountId: account.id,
      categoryId: null,
      transferToId: null,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: "",
      note: "",
    });
  };

  const startDuplicate = (row: TransactionApiItem) => {
    setCreatingTransaction({
      type: row.type,
      accountId: row.accountId,
      categoryId: row.categoryId,
      transferToId: row.transferToId,
      amount: row.amount,
      adminFee: row.adminFee,
      date: new Date().toISOString().slice(0, 10),
      description: row.description ?? "",
      note: row.note ?? "",
    });
  };

  if (loading && !account) {
    return <SkeletonAnalytics />;
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-foreground mb-2">
          {language === "id" ? "Akun tidak ditemukan" : "Account not found"}
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/accounts">
            {language === "id" ? "Kembali ke daftar akun" : "Back to accounts list"}
          </Link>
        </Button>
      </div>
    );
  }

  const accountFormInitial: AccountFormInitial = {
    id: account.id,
    name: account.name,
    type: account.type as AccountTypeInput,
    color: account.color ?? null,
    icon: account.icon ?? null,
    isActive: account.isActive,
    balance: account.balance,
  };

  const netFlow = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header / Breadcrumbs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 px-3 -ml-2 text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]">
            <Link to="/accounts">
              <ArrowLeft size={14} />
              {language === "id" ? "Kembali ke daftar akun" : "Back to accounts list"}
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <div 
              className="size-9 rounded-xl flex items-center justify-center border text-lg"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${normalizeColor(account.color)} 12%, transparent)`, 
                color: normalizeColor(account.color),
                borderColor: `color-mix(in srgb, ${normalizeColor(account.color)} 20%, transparent)`
              }}
            >
              {account.icon && account.icon !== "none" ? account.icon : "🏦"}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {account.name}
            </h1>
            {!account.isActive && (
              <Badge variant="outline" className="bg-white/[0.02] border-white/[0.08] text-muted-foreground/60 text-[9px] font-bold font-mono py-0.5 px-1.5">
                {language === "id" ? "NONAKTIF" : "INACTIVE"}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={startCreate}
            className="h-9 rounded-xl gap-2 text-xs font-semibold px-4"
          >
            <Plus size={14} strokeWidth={2.5} />
            {language === "id" ? "Tambah Transaksi" : "Add Transaction"}
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 border border-border/50 bg-transparent text-foreground hover:bg-white/[0.04] hover:border-border transition-all flex items-center justify-center gap-2 text-xs font-semibold px-4"
                style={{ borderRadius: 'var(--dropdown-radius, 12px)' }}
              >
                <Download size={14} />
                {language === "id" ? "Ekspor/Impor" : "Export/Import"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface border-border z-[99999]">
              <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer flex items-center gap-2">
                <span>CSV Format (Export)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer flex items-center gap-2">
                <span>PDF Format (Export)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem onClick={() => setImportStatementOpen(true)} className="cursor-pointer flex items-center gap-2 text-accent focus:text-accent font-semibold">
                <span>Import PDF / CSV (AI)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            onClick={() => setEditingAccount(true)}
            className="h-9 rounded-xl gap-1.5 text-xs font-semibold px-3.5 border-white/[0.06] hover:bg-white/[0.04]"
          >
            <Pencil size={13} />
            {language === "id" ? "Ubah" : "Edit"}
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-xl border-white/[0.06] hover:bg-white/[0.04]"
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl p-1 shadow-2xl">
              <DropdownMenuItem
                onSelect={handleToggleActive}
                disabled={togglingAccountPending}
                className="rounded-lg text-xs px-3 py-2.5 gap-2.5 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
              >
                {account.isActive ? (
                  <>
                    <PowerOff size={13} className="text-muted-foreground" />
                    <span>{language === "id" ? "Nonaktifkan Akun" : "Deactivate Account"}</span>
                  </>
                ) : (
                  <>
                    <Power size={13} className="text-income" />
                    <span>{language === "id" ? "Aktifkan Akun" : "Activate Account"}</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              <DropdownMenuItem
                onSelect={() => setConfirmDeleteAccount(true)}
                className="rounded-lg text-xs px-3 py-2.5 gap-2.5 cursor-pointer text-expense hover:bg-expense/10 focus:bg-expense/10"
              >
                <Trash2 size={13} />
                <span>{language === "id" ? "Hapus Akun" : "Delete Account"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Balance */}
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div 
            className="absolute top-3 right-3 size-8 rounded-lg flex items-center justify-center border"
            style={{ 
              backgroundColor: `color-mix(in srgb, ${normalizeColor(account.color)} 10%, transparent)`, 
              color: normalizeColor(account.color),
              borderColor: `color-mix(in srgb, ${normalizeColor(account.color)} 15%, transparent)`
            }}
          >
            <span className="text-xs">{account.icon && account.icon !== "none" ? account.icon : "🏦"}</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            {language === "id" ? "Saldo Saat Ini" : "Current Balance"}
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
            {formatIDR(account.balance)}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            {language === "id" ? "Kategori Akun: " : "Account Type: "} {accountTypeLabel[account.type] ?? account.type}
          </p>
        </Card>

        {/* Card 2: Income */}
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-income/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-income"><path d="M7.5 12V3M7.5 3L4 6.5M7.5 3L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            {language === "id" ? "Total Pemasukan" : "Total Inflow"}
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-income">
            {formatIDR(totalIncome)}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            {language === "id" ? "Semua pemasukan & transfer masuk" : "All income & inbound transfers"}
          </p>
        </Card>

        {/* Card 3: Expenses */}
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-expense/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-expense"><path d="M7.5 3V12M7.5 12L4 8.5M7.5 12L11 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            {language === "id" ? "Total Pengeluaran" : "Total Outflow"}
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-expense">
            {formatIDR(totalExpense)}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            {language === "id" ? "Semua pengeluaran & transfer keluar" : "All expenses & outbound transfers"}
          </p>
        </Card>

        {/* Card 4: Net Flow */}
        <Card className="p-4 gap-0 relative overflow-hidden">
          <div className="absolute top-3 right-3 size-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
            <ArrowLeftRight size={15} className="text-text-muted/75" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            {language === "id" ? "Aliran Bersih" : "Net Cashflow"}
          </p>
          <p className={`text-xl font-bold font-mono tabular-nums ${netFlow >= 0 ? "text-income" : "text-expense"}`}>
            {netFlow >= 0 ? "+" : ""}{formatIDR(netFlow)}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            {language === "id" ? "Selisih pemasukan vs pengeluaran" : "Difference between inflow & outflow"}
          </p>
        </Card>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        {/* Section Header & Filters (no double cards to prevent borders overlapping) */}
        <Card className="p-0 overflow-hidden gap-0">
          <div className="px-5 py-4 border-b border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{language === "id" ? "Riwayat Transaksi" : "Transaction History"}</span>
                <span className="text-xs font-mono py-0.5 px-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-muted-foreground/60 tabular-nums">
                  {totalCount}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {language === "id"
                  ? "Menampilkan aktivitas keuangan terbaru pada akun ini"
                  : "Showing the latest financial activities on this account"}
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 bg-white/[0.01] flex flex-col md:flex-row items-center gap-3">
            {/* Search box */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/45 size-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "id" ? "Cari deskripsi, kategori, catatan..." : "Search description, category, note..."}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all hover:bg-white/[0.05] hover:border-white/[0.12] focus:bg-white/[0.04]"
              />
            </div>

            {/* Type filter toggles */}
            <div className="flex bg-white/[0.02] border border-white/[0.06] rounded-xl p-0.5 gap-0.5 w-full md:w-auto overflow-x-auto shrink-0">
              {(["all", "income", "expense", "transfer"] as const).map((type) => {
                const labelMap: Record<string, string> = {
                  all: language === "id" ? "Semua" : "All",
                  income: language === "id" ? "Masuk" : "Inflow",
                  expense: language === "id" ? "Keluar" : "Outflow",
                  transfer: "Transfer",
                };
                const isActive = typeFilter === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex-1 md:flex-initial text-center whitespace-nowrap ${
                      isActive
                        ? "bg-accent/15 text-accent border border-accent/25 font-extrabold"
                        : "text-muted-foreground/70 hover:text-foreground border border-transparent"
                    }`}
                  >
                    {labelMap[type]}
                  </button>
                );
              })}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <SlidersHorizontal size={13} className="text-muted-foreground/60 shrink-0" />
              <CustomSelect
                label={language === "id" ? "Urutkan" : "Sort By"}
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={[
                  { value: "date-desc", label: language === "id" ? "Terkini" : "Newest" },
                  { value: "date-asc", label: language === "id" ? "Terlama" : "Oldest" },
                  { value: "amount-desc", label: language === "id" ? "Nominal Tertinggi" : "Highest Amount" },
                  { value: "amount-asc", label: language === "id" ? "Nominal Terendah" : "Lowest Amount" },
                ]}
              />
            </div>
          </div>

          {/* Date range row */}
          <div className="px-5 py-3.5 bg-white/[0.01] border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-muted shrink-0">
                {language === "id" ? "Rentang Tanggal" : "Date Range"}
              </span>
              <CustomDateRangePicker
                startDate={startDate}
                endDate={endDate}
                onPick={(range) => {
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
              />
            </div>
            {(startDate || endDate) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-text-muted hover:text-text-primary h-7 px-2.5 self-end sm:self-auto"
              >
                {language === "id" ? "Reset Filter" : "Reset Filters"}
              </Button>
            ) : null}
          </div>
        </Card>

        {/* Transactions list grouped by date (consistent with Transactions page table) */}
        {filteredAndSortedTransactions.length === 0 ? (
          <Card className={cn("gap-0 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
            <EmptyState
              icon={Inbox}
              title={language === "id" ? "Tidak ada transaksi" : "No transactions found"}
              description={
                language === "id"
                  ? "Gunakan kata kunci pencarian atau filter tipe transaksi yang berbeda."
                  : "Try adjusting your search query or switching to another transaction type filter."
              }
              size="sm"
            />
          </Card>
        ) : (
          <div className={cn("space-y-4 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
            {groupedTransactions.map((group) => {
              const netColor =
                group.net > 0 ? "text-income" : group.net < 0 ? "text-expense" : "text-text-primary";

              return (
                <section key={group.date} className="space-y-2">
                  {/* Daily Subheader */}
                  <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-white/[0.05] bg-surface/85 backdrop-blur-md transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {group.relative && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded">
                              {group.relative}
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
                        <span className={`text-xs font-mono font-bold tabular-nums ${netColor}`}>
                          {group.net > 0 ? "+" : ""}
                          {formatIDR(group.net)}
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* Daily Rows Container */}
                  <Card className="divide-y divide-white/[0.04] overflow-hidden gap-0 p-0">
                    {group.items.map((tx) => {
                      const amount = Number(tx.amount);
                      const isIncoming =
                        tx.type === "income" ||
                        (tx.type === "transfer" && tx.transferToId === id);
                      
                      const style = {
                        income: { chip: "bg-income/10 border-income/25 text-income", amount: "text-income", sign: "+" },
                        expense: { chip: "bg-expense/10 border-expense/25 text-expense", amount: "text-expense", sign: "-" },
                        transfer: { chip: "bg-accent/10 border-accent/25 text-accent", amount: isIncoming ? "text-income" : "text-expense", sign: isIncoming ? "+" : "-" },
                      }[tx.type];

                      const categoryName = tx.category?.name || (language === "id" ? "Tanpa Kategori" : "Uncategorized");
                      const initialChar = (tx.description ?? categoryName ?? "T").trim().charAt(0).toUpperCase() || "T";

                      return (
                        <div
                          key={tx.id}
                          className="relative flex items-center gap-3 pl-4 pr-3 py-2.5 transition-colors duration-150 group/row hover:bg-elevated/40"
                        >
                          {/* Icon Badge */}
                          <div
                            className={`size-9 rounded-xl border flex items-center justify-center text-sm font-bold uppercase shrink-0 font-mono transition-transform duration-200 group-hover/row:scale-105 ${style.chip}`}
                          >
                            {tx.type === "transfer" ? <ArrowLeftRight size={15} /> : tx.category?.icon || initialChar}
                          </div>

                          {/* Details Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                                {tx.description || (tx.type === "transfer" 
                                  ? tx.accountId === id
                                    ? `Transfer → ${tx.transferTo?.name ?? "?"}`
                                    : `Transfer ← ${tx.account?.name ?? "?"}`
                                  : categoryName
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[11px] text-text-muted/80 min-w-0">
                              <span className="truncate max-w-[120px] font-medium">{account?.name}</span>
                              {tx.type === "transfer" && (tx.transferTo?.name || tx.account?.name) && (
                                <>
                                  <ArrowLeftRight size={9} className="opacity-50 shrink-0" />
                                  <span className="truncate max-w-[120px]">
                                    {tx.accountId === id ? tx.transferTo?.name : tx.account?.name}
                                  </span>
                                </>
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

                          {/* Category Badge (Desktop only) */}
                          <div className="hidden md:flex items-center shrink-0 w-[150px] justify-end">
                            {tx.type === "transfer" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/5 border border-accent/15 text-accent text-[11px] font-medium">
                                <ArrowLeftRight size={11} />
                                {language === "id" ? "Transfer" : "Transfer"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-foreground">
                                {tx.category?.icon && (
                                  <span className="text-xs" aria-hidden>{tx.category.icon}</span>
                                )}
                                <span>{categoryName}</span>
                              </span>
                            )}
                          </div>

                          {/* Amount */}
                          <p
                            className={`font-mono tabular-nums text-xs sm:text-sm font-bold whitespace-nowrap text-right min-w-[70px] sm:min-w-[96px] shrink-0 ${style.amount}`}
                          >
                            {style.sign}
                            {formatIDR(amount)}
                          </p>

                          {/* Dropdown Options */}
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
                              <DropdownMenuItem onSelect={() => setEditingTransaction(tx)} className="gap-2 cursor-pointer">
                                <Pencil size={13} />
                                {t("editOption")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => startDuplicate(tx)} className="gap-2 cursor-pointer font-medium">
                                <Copy size={13} />
                                {t("duplicateOption")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/40" />
                              <DropdownMenuItem onSelect={() => setDeletingTransaction(tx)} variant="destructive" className="gap-2 cursor-pointer text-expense focus:text-expense">
                                <Trash2 size={13} />
                                {t("deleteOption")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </Card>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Account Form Modal (Edit) */}
      {editingAccount && (
        <AccountForm
          open={editingAccount}
          onClose={() => setEditingAccount(false)}
          mode="edit"
          initial={accountFormInitial}
          onSuccess={() => {
            setEditingAccount(false);
            fetchData();
            refreshGlobal();
          }}
        />
      )}

      {/* Account Confirm Delete Modal */}
      <Dialog open={confirmDeleteAccount} onOpenChange={(open) => !open && setConfirmDeleteAccount(false)}>
        <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{language === "id" ? "Hapus Akun" : "Delete Account"}</DialogTitle>
            <DialogDescription>
              {language === "id" 
                ? `Apakah Anda yakin ingin menghapus akun "${account.name}"? Tindakan ini tidak dapat dibatalkan.` 
                : `Are you sure you want to delete the account "${account.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Card className="p-4 gap-0 bg-white/[0.02] border-white/[0.06]">
              <p className="text-sm font-semibold text-foreground">
                {account.name}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono tabular-nums">
                {formatIDR(account.balance)} · {totalCount} {language === "id" ? "transaksi terkait" : "related transactions"}
              </p>
            </Card>
            {totalCount > 0 && (
              <p className="text-xs text-warning/80">
                {language === "id"
                  ? `Akun ini memiliki ${totalCount} transaksi. Menghapus akun ini juga akan menghapus atau memutuskan relasi transaksi tersebut. Disarankan untuk menonaktifkan akun saja.`
                  : `This account has ${totalCount} transactions. Deleting it will affect these transactions. We recommend deactivating it instead.`}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteAccount(false)} disabled={deletingAccountPending} className="rounded-xl">
              {language === "id" ? "Batal" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccountPending} className="rounded-xl">
              {deletingAccountPending
                ? (language === "id" ? "Menghapus..." : "Deleting...")
                : (language === "id" ? "Hapus" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Create Modal */}
      {creatingTransaction && (
        <TransactionForm
          open={creatingTransaction !== null}
          onClose={() => setCreatingTransaction(null)}
          mode="create"
          initial={creatingTransaction}
          accounts={accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance }))}
          categories={categories.map(c => ({ id: c.id, name: c.name, type: c.type, icon: c.icon }))}
          aiScanEnabled={true}
          onSuccess={() => {
            setCreatingTransaction(null);
            fetchData();
            refreshGlobal();
          }}
        />
      )}

      {/* Transaction Edit Modal */}
      {editingTransaction && (
        <TransactionForm
          open={editingTransaction !== null}
          onClose={() => setEditingTransaction(null)}
          mode="edit"
          initial={toFormInitial(editingTransaction)}
          accounts={accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance }))}
          categories={categories.map(c => ({ id: c.id, name: c.name, type: c.type, icon: c.icon }))}
          aiScanEnabled={true}
          onSuccess={() => {
            setEditingTransaction(null);
            fetchData();
            refreshGlobal();
          }}
        />
      )}

      {/* Transaction Confirm Delete Modal */}
      {deletingTransaction && (
        <ConfirmDeleteTransaction
          target={toRowData(deletingTransaction)}
          onClose={() => setDeletingTransaction(null)}
          onDeleted={() => {
            setDeletingTransaction(null);
            fetchData();
            refreshGlobal();
          }}
        />
      )}

      {/* Import PDF/CSV Statement Modal */}
      <ImportStatementModal
        open={importStatementOpen}
        onClose={() => setImportStatementOpen(false)}
        accountId={id || ""}
        accounts={accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance }))}
        categories={categories.map(c => ({ id: c.id, name: c.name, type: c.type, icon: c.icon }))}
        onSuccess={() => {
          fetchData();
          refreshGlobal();
        }}
      />
    </div>
  );
}
