import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/components/layout/AppLayout";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";
import { SkeletonTransactions } from "@/components/ui/skeleton-loader";
import { api } from "@/lib/api";
import type { TransactionApiItem } from "@/types";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const REFRESH_DEBOUNCE_MS = 300;

interface TransactionsPageData {
  transactions: TransactionApiItem[];
  total: number;
  income: number;
  expense: number;
}

export default function Transactions() {
  const { accounts, categories } = useApp();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TransactionsPageData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoised mapping — avoids re-creating objects on every render
  const transactions = useMemo(
    () =>
      (data?.transactions || []).map((tx) => ({
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
      })),
    [data],
  );

  // Parse filters from URL
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const accountId = searchParams.get("accountId") || "all";
  const categoryId = searchParams.get("categoryId") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || String(PAGE_SIZE_DEFAULT), 10);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (type && type !== "all") params.set("type", type);
      if (accountId && accountId !== "all") params.set("accountId", accountId);
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await api.get<TransactionsPageData>(`/api/transactions?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setFetchError(err instanceof Error ? err.message : "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  }, [q, type, accountId, categoryId, startDate, endDate, page, pageSize]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debounced refresh listener — prevents multiple concurrent fetches
  useEffect(() => {
    const handleRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchTransactions();
      }, REFRESH_DEBOUNCE_MS);
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fetchTransactions]);

  if (loading && !data) {
    return <SkeletonTransactions />;
  }

  // Error state with retry
  if (fetchError && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center p-8">
        <div className="size-14 rounded-2xl bg-expense/10 border border-expense/20 flex items-center justify-center">
          <AlertTriangle className="size-7 text-expense" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <p className="text-sm font-semibold text-text-primary">
            {language === "id" ? "Gagal memuat transaksi" : "Failed to load transactions"}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">{fetchError}</p>
        </div>
        <Button onClick={fetchTransactions} size="sm" className="gap-2">
          <RefreshCw size={14} />
          {language === "id" ? "Coba lagi" : "Retry"}
        </Button>
      </div>
    );
  }


  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <TransactionsClient
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      filters={{
        q,
        type: type as "all" | "income" | "expense" | "transfer",
        accountId,
        categoryId,
        startDate,
        endDate,
      }}
      pagination={{
        page,
        pageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        total,
        totalPages,
      }}
      summary={{
        total,
        income: data?.income || 0,
        expense: data?.expense || 0,
      }}
      aiScanEnabled={true}
    />
  );
}
