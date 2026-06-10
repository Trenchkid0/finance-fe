import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/components/layout/AppLayout";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Transactions() {
  const { accounts, categories } = useApp();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Parse filters from URL
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const accountId = searchParams.get("accountId") || "all";
  const categoryId = searchParams.get("categoryId") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || String(PAGE_SIZE_DEFAULT), 10);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
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

      const res = await api.get<any>(`/api/transactions?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [q, type, accountId, categoryId, startDate, endDate, page, pageSize]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchTransactions();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [q, type, accountId, categoryId, startDate, endDate, page, pageSize]);

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const transactions = (data?.transactions || []).map((tx: any) => ({
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
    receiptImageUrl: tx.receiptImageUrl ?? null,
  }));

  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <TransactionsClient
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      filters={{
        q,
        type: type as any,
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
