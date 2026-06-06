import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Inbox, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  bank: "Bank",
  wallet: "E-wallet",
  cash: "Tunai",
  investment: "Investasi",
};

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const acc = await api.get<any>(`/api/accounts/${id}`);
      const txResponse = await api.get<any>(`/api/transactions?accountId=${id}&limit=50`);
      setAccount(acc);
      // Backend returns a TransactionsListResponse which contains transactions array
      setTransactions(txResponse.transactions || []);
    } catch (err) {
      console.error("Failed to fetch account detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-foreground mb-2">Akun tidak ditemukan</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/accounts">Kembali ke daftar akun</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/accounts">
            <ArrowLeft size={14} />
            Kembali ke daftar akun
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            {account.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ACCOUNT_TYPE_LABEL[account.type] ?? account.type}
            {account.isActive ? "" : " · Nonaktif"}
          </p>
        </div>
      </header>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Saldo saat ini
        </p>
        <p className="text-3xl font-semibold font-mono tabular-nums text-foreground mt-1">
          {formatIDR(Number(account.balance))}
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-foreground">
            Transaksi terkait (50 terbaru)
          </h2>
          {transactions.length > 0 ? (
            <Link
              to={`/transactions?accountId=${id}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Lihat semua
            </Link>
          ) : null}
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Belum ada transaksi"
            description="Transaksi yang melibatkan akun ini akan tampil di sini."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-elevated">
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Deskripsi</th>
                  <th className="px-4 py-2.5 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const amount = Number(tx.amount);
                  const isIncoming =
                    tx.type === "income" ||
                    (tx.type === "transfer" && tx.transferToId === id);
                  const isOutgoing =
                    tx.type === "expense" ||
                    (tx.type === "transfer" && tx.accountId === id);
                  const tone = isIncoming
                    ? "text-income"
                    : isOutgoing
                      ? "text-expense"
                      : "text-foreground";
                  const sign = isIncoming ? "+" : isOutgoing ? "-" : "";

                  const subtitle =
                    tx.type === "transfer"
                      ? tx.accountId === id
                        ? `Transfer → ${tx.transferTo?.name ?? "?"}`
                        : `Transfer ← ${tx.account?.name ?? "?"}`
                      : tx.category?.name ?? "Tanpa kategori";

                  return (
                    <tr
                      key={tx.id}
                      className="text-sm text-foreground hover:bg-elevated/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateShort(tx.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="block font-medium">
                            {tx.description ?? subtitle}
                          </span>
                          {tx.type === "transfer" ? (
                            <Badge variant="outline" className="font-normal text-[10px] py-0 h-4">
                              <ArrowLeftRight size={8} className="mr-0.5" />
                              {tx.accountId === id ? "Keluar" : "Masuk"}
                            </Badge>
                          ) : null}
                        </div>
                        {tx.description ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            {tx.category?.icon ? (
                              <span aria-hidden>{tx.category.icon}</span>
                            ) : null}
                            {subtitle}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${tone}`}
                      >
                        {sign}
                        {formatIDR(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
