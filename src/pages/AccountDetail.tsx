import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Inbox, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Breadcrumbs / Header */}
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 px-3 -ml-2 text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]">
          <Link to="/accounts">
            <ArrowLeft size={14} />
            Kembali ke daftar akun
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
              Detail Akun
            </h1>
            {!account.isActive && (
              <Badge variant="outline" className="bg-white/[0.02] border-white/[0.08] text-muted-foreground/60 text-[10px] font-bold font-mono">
                NONAKTIF
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground/85 mt-1">
            Lihat riwayat transaksi dan rincian alokasi saldo dari akun Anda.
          </p>
        </div>
      </header>

      {/* Account Info Card */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent p-6 overflow-hidden">
        {/* Decorative background glow using account color */}
        <div 
          className="absolute -right-12 -top-12 w-36 h-36 rounded-full blur-[60px] opacity-15 pointer-events-none" 
          style={{ backgroundColor: account.color || "#388BFD" }}
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div 
              className="size-14 rounded-2xl flex items-center justify-center text-2xl border"
              style={{ 
                backgroundColor: `${account.color || "#388BFD"}15`, 
                color: account.color || "#388BFD",
                borderColor: `${account.color || "#388BFD"}25`
              }}
            >
              {account.icon || "🏦"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {account.name}
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Kategori: {ACCOUNT_TYPE_LABEL[account.type] ?? account.type}
              </p>
            </div>
          </div>
          
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65">
              Saldo saat ini
            </p>
            <p className="text-3xl font-black font-mono tracking-tight text-foreground mt-1 tabular-nums">
              {formatIDR(Number(account.balance))}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Transaksi Terkait
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Menampilkan hingga 50 aktivitas keuangan terbaru
            </p>
          </div>
          {transactions.length > 0 ? (
            <Link
              to={`/transactions?accountId=${id}`}
              className="text-xs font-semibold text-accent hover:underline"
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
          <div className="space-y-1">
            {/* Header kolom (desktop saja) */}
            <div className="hidden md:grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-muted-foreground/45 uppercase tracking-wider">
              <span className="col-span-2">Tanggal</span>
              <span className="col-span-8">Deskripsi & Kategori</span>
              <span className="col-span-2 text-right">Jumlah</span>
            </div>

            {/* List item */}
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
                <div
                  key={tx.id}
                  className="grid grid-cols-12 items-center px-4 py-3 rounded-xl border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-200 gap-2 md:gap-0"
                >
                  {/* Tanggal */}
                  <div className="col-span-12 md:col-span-2 text-xs font-mono text-muted-foreground/60">
                    {formatDateShort(tx.date)}
                  </div>

                  {/* Deskripsi & Kategori */}
                  <div className="col-span-8 md:col-span-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                        {tx.description || subtitle}
                      </span>
                      {tx.type === "transfer" ? (
                        <Badge variant="outline" className="bg-white/[0.02] border-white/[0.08] text-[9px] font-bold py-0.5 px-1.5 rounded-md text-muted-foreground/75 flex items-center gap-1 font-mono">
                          <ArrowLeftRight size={9} />
                          {tx.accountId === id ? "KELUAR" : "MASUK"}
                        </Badge>
                      ) : null}
                    </div>
                    {tx.description ? (
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5 mt-0.5">
                        {tx.category?.icon && (
                          <span className="text-xs" aria-hidden>{tx.category.icon}</span>
                        )}
                        <span>{subtitle}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Jumlah */}
                  <div className={`col-span-4 md:col-span-2 text-right font-mono text-sm font-bold tabular-nums ${tone}`}>
                    {sign}
                    {formatIDR(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
