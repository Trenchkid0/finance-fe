import { Link } from "react-router-dom";
import { ArrowLeftRight, Plus, Wallet, ArrowRight } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

export interface RecentTransactionItem {
  id: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  accountName: string;
  transferToName: string | null;
  date: string;
  amount: number;
  type: "income" | "expense" | "transfer";
}

interface Props {
  transactions: RecentTransactionItem[];
}

export function RecentTransactions({ transactions }: Props) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col transition-all duration-300 hover:border-white/[0.1] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/[0.04] shrink-0">
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-foreground">
            Transaksi Terakhir
          </h2>
          <p className="text-[11px] text-muted-foreground/50">
            Aktivitas keuangan terbaru dari seluruh akun
          </p>
        </div>
        <Link
          to="/transactions"
          className="group flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-all duration-200"
        >
          Lihat Semua
          <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada transaksi"
          description="Catat transaksi pertama Anda untuk mulai melacak."
          action={
            <Button size="sm" asChild className="rounded-xl">
              <Link to="/transactions">
                <Plus size={12} className="mr-1" />
                Tambah transaksi
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Column header (desktop only) */}
          <div className="hidden md:grid grid-cols-12 px-6 py-2.5 bg-white/[0.01] border-b border-white/[0.04] shrink-0 text-[10px] font-bold text-muted-foreground/45 uppercase tracking-wider">
            <span className="col-span-2">Tanggal</span>
            <span className="col-span-5">Deskripsi</span>
            <span className="col-span-3">Akun</span>
            <span className="col-span-2 text-right">Jumlah</span>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {/* Desktop rows */}
            <div className="hidden md:block p-3 space-y-1">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className={cn(
                    "group grid grid-cols-12 items-center px-4 py-3 rounded-xl border border-transparent",
                    "bg-transparent hover:bg-white/[0.03] hover:border-white/[0.06]",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: 'fade-in-up 300ms ease-out backwards'
                  }}
                >
                  {/* Date */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-foreground font-mono">
                        {new Date(tx.date).getDate()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/50 font-mono tracking-tight transition-colors duration-200 group-hover:text-foreground">
                      {formatDateShort(tx.date)}
                    </span>
                  </div>

                  {/* Description with category badge */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0 pr-2">
                    <p className="text-[13px] text-foreground font-semibold truncate transition-all duration-200 group-hover:text-accent">
                      {tx.description}
                    </p>
                    {tx.type === "transfer" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-accent/10 border-accent/20 text-accent">
                        <ArrowLeftRight size={8} />
                        Transfer
                      </span>
                    ) : tx.categoryName ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-white/[0.04] border-white/[0.08] text-muted-foreground/70">
                        {tx.categoryIcon && <span className="mr-0.5">{tx.categoryIcon}</span>}
                        {tx.categoryName}
                      </span>
                    ) : null}
                  </div>

                  {/* Account info */}
                  <span className="col-span-3 text-xs text-muted-foreground/50 truncate pr-2 transition-colors duration-200 group-hover:text-foreground/80">
                    {tx.type === "transfer"
                      ? `${tx.accountName} → ${tx.transferToName ?? "?"}`
                      : tx.accountName}
                  </span>

                  {/* Amount */}
                  <div className="col-span-2 flex justify-end">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono tabular-nums px-2.5 py-1 rounded-lg",
                        "transition-all duration-200 group-hover:scale-[1.03]",
                        tx.type === "income" && "text-income bg-income/10",
                        tx.type === "expense" && "text-expense bg-expense/10",
                        tx.type === "transfer" && "text-foreground bg-white/[0.04] border border-white/[0.08]"
                      )}
                    >
                      {amountPrefix(tx.type)}
                      {formatIDR(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile stacked rows */}
            <ul className="md:hidden p-2 space-y-1">
              {transactions.map((tx, index) => (
                <li
                  key={tx.id}
                  className={cn(
                    "group flex items-start gap-3 p-3 rounded-xl border border-transparent",
                    "bg-transparent hover:bg-white/[0.03] hover:border-white/[0.06]",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: 'fade-in-up 300ms ease-out backwards'
                  }}
                >
                  {/* Date badge */}
                  <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-foreground leading-none font-mono">
                      {new Date(tx.date).getDate()}
                    </span>
                    <span className="text-[8px] text-muted-foreground/50 uppercase font-black leading-none mt-0.5 font-mono">
                      {new Date(tx.date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground font-semibold truncate transition-all duration-200 group-hover:text-accent">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground/50 font-medium">
                      {tx.type === "transfer" ? (
                        <>
                          <ArrowLeftRight size={10} className="text-accent" />
                          <span className="truncate">Transfer → {tx.transferToName ?? "?"}</span>
                        </>
                      ) : (
                        <>
                          {tx.categoryIcon && <span>{tx.categoryIcon}</span>}
                          <span className="truncate">{tx.categoryName ?? "Tanpa kategori"}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="truncate">{tx.accountName}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0">
                    <p
                      className={cn(
                        "text-xs font-bold font-mono tabular-nums px-2.5 py-1 rounded-lg text-right",
                        tx.type === "income" && "text-income bg-income/10",
                        tx.type === "expense" && "text-expense bg-expense/10",
                        tx.type === "transfer" && "text-foreground bg-white/[0.04]"
                      )}
                    >
                      {amountPrefix(tx.type)}
                      {formatIDR(tx.amount)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          {transactions.length > 5 && (
            <div className="px-6 py-3 border-t border-white/[0.04] bg-white/[0.01] shrink-0">
              <Link
                to="/transactions"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-all duration-200"
              >
                Lihat semua {transactions.length} transaksi
                <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function amountPrefix(type: "income" | "expense" | "transfer"): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}
