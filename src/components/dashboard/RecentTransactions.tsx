import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Plus, Wallet, ArrowRight } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export interface RecentTransactionItem {
  id: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  accountName: string;
  transferToName: string | null;
  date: string;
  amount: number;
  adminFee: number;
  type: "income" | "expense" | "transfer";
}

interface Props {
  transactions: RecentTransactionItem[];
}

export const RecentTransactions = memo(function RecentTransactions({ transactions }: Props) {
  const { language } = useLanguage();

  return (
    <Card className="overflow-hidden flex flex-col p-0 gap-0">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 border-b border-border/30 shrink-0">
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-foreground">
            {language === "id" ? "Transaksi Terakhir" : "Recent Transactions"}
          </h2>
          <p className="text-[11px] text-muted-foreground/50">
            {language === "id"
              ? "Aktivitas keuangan terbaru dari seluruh akun"
              : "Latest financial activity across all accounts"}
          </p>
        </div>
        <Link
          to="/transactions"
          className="group flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-all duration-200"
        >
          {language === "id" ? "Lihat Semua" : "View All"}
          <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={language === "id" ? "Belum ada transaksi" : "No transactions yet"}
          description={
            language === "id"
              ? "Catat transaksi pertama Anda untuk mulai melacak."
              : "Record your first transaction to start tracking."
          }
          action={
            <Button size="sm" asChild className="rounded-xl">
              <Link to="/transactions">
                <Plus size={12} className="mr-1" />
                {language === "id" ? "Tambah transaksi" : "Add transaction"}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Column header (desktop only) */}
          <div className="hidden md:grid grid-cols-12 px-6 py-2.5 bg-elevated/20 border-b border-border/30 shrink-0 text-[10px] font-bold text-muted-foreground/45 uppercase tracking-wider">
            <span className="col-span-2">{language === "id" ? "Tanggal" : "Date"}</span>
            <span className="col-span-5">{language === "id" ? "Deskripsi" : "Description"}</span>
            <span className="col-span-3">{language === "id" ? "Akun" : "Account"}</span>
            <span className="col-span-2 text-right">{language === "id" ? "Jumlah" : "Amount"}</span>
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
                    "bg-transparent hover:bg-hover-surface/50 hover:border-hover-border/40",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: 'fade-in-up 300ms ease-out backwards'
                  }}
                >
                  {/* Date */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-elevated border border-border/60 flex items-center justify-center shrink-0">
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
                        {language === "id" ? "Transfer" : "Transfer"}
                      </span>
                    ) : tx.categoryName ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-elevated border-border/60 text-muted-foreground/70">
                        {tx.categoryIcon && <span className="mr-0.5">{tx.categoryIcon}</span>}
                        {tx.categoryName}
                      </span>
                    ) : null}
                    {tx.adminFee > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-expense/10 border-expense/20 text-expense font-mono">
                        Fee: {formatIDR(tx.adminFee)}
                      </span>
                    )}
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
                        tx.type === "transfer" && "text-foreground bg-elevated border border-border/60"
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
                    "bg-transparent hover:bg-hover-surface/50 hover:border-hover-border/40",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: 'fade-in-up 300ms ease-out backwards'
                  }}
                >
                  {/* Date badge */}
                  <div className="h-10 w-10 rounded-lg bg-elevated border border-border/60 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-foreground leading-none font-mono">
                      {new Date(tx.date).getDate()}
                    </span>
                    <span className="text-[8px] text-muted-foreground/50 uppercase font-black leading-none mt-0.5 font-mono">
                      {new Date(tx.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground font-semibold truncate transition-all duration-200 group-hover:text-accent">
                      {tx.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground/50 font-medium">
                      {tx.type === "transfer" ? (
                        <>
                          <ArrowLeftRight size={10} className="text-accent" />
                          <span className="truncate">{language === "id" ? "Transfer" : "Transfer"} → {tx.transferToName ?? "?"}</span>
                        </>
                      ) : (
                        <>
                          {tx.categoryIcon && <span>{tx.categoryIcon}</span>}
                          <span className="truncate">{tx.categoryName ?? (language === "id" ? "Tanpa kategori" : "Uncategorized")}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="truncate">{tx.accountName}</span>
                      {tx.adminFee > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-expense font-semibold text-[9px] bg-expense/10 border border-expense/20 px-1 py-0.2 rounded font-mono">
                            Fee: {formatIDR(tx.adminFee)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0">
                    <p
                      className={cn(
                        "text-xs font-bold font-mono tabular-nums px-2.5 py-1 rounded-lg text-right",
                        tx.type === "income" && "text-income bg-income/10",
                        tx.type === "expense" && "text-expense bg-expense/10",
                        tx.type === "transfer" && "text-foreground bg-elevated border border-border/60"
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
            <div className="px-6 py-3 border-t border-border/30 bg-elevated/10 shrink-0">
              <Link
                to="/transactions"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-all duration-200"
              >
                {language === "id"
                  ? `Lihat semua ${transactions.length} transaksi`
                  : `View all ${transactions.length} transactions`}
                <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </Card>
  );
});

function amountPrefix(type: "income" | "expense" | "transfer"): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}
