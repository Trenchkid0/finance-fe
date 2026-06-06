import { Link } from "react-router-dom";
import { ArrowLeftRight, Plus, Wallet } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Recent transactions block on the dashboard.
 *
 * Compact fixed-height card dengan overflow-y-auto — maksimal ~6 baris
 * terlihat sebelum scroll, sehingga tidak mendorong konten halaman ke bawah
 * seberapa pun banyaknya transaksi.
 */
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
    <section className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Header — always visible */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <h2 className="text-sm font-medium text-foreground">
          Transaksi terakhir
        </h2>
        <Link
          to="/transactions"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          Lihat semua →
        </Link>
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada transaksi"
          description="Catat transaksi pertama Anda untuk mulai melacak."
          action={
            <Button size="sm" asChild>
              <Link to="/transactions">
                <Plus size={12} />
                Tambah transaksi
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Column header (desktop only) — pinned above scroll area */}
          <div className="hidden md:grid grid-cols-12 px-5 py-2 bg-elevated border-b border-border shrink-0 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span className="col-span-2">Tanggal</span>
            <span className="col-span-5">Deskripsi</span>
            <span className="col-span-3">Akun</span>
            <span className="col-span-2 text-right">Jumlah</span>
          </div>

          {/* Scrollable body — capped at ~6 rows (52px each) */}
          <div className="overflow-y-auto" style={{ maxHeight: "312px" }}>
            {/* Desktop rows */}
            <div className="hidden md:block divide-y divide-border">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 items-center px-5 py-2.5 hover:bg-elevated/60 transition-colors duration-150"
                >
                  <span className="col-span-2 text-[11px] text-muted-foreground font-mono tabular-nums whitespace-nowrap">
                    {formatDateShort(tx.date)}
                  </span>

                  <div className="col-span-5 flex items-center gap-2 min-w-0 pr-2">
                    <p className="text-sm text-foreground truncate">
                      {tx.description}
                    </p>
                    {tx.type === "transfer" ? (
                      <Badge variant="outline" className="font-normal shrink-0 text-[10px] py-0">
                        <ArrowLeftRight size={9} />
                        Transfer
                      </Badge>
                    ) : tx.categoryName ? (
                      <Badge variant="secondary" className="font-normal shrink-0 text-[10px] py-0">
                        {tx.categoryIcon ? (
                          <span aria-hidden className="mr-0.5">{tx.categoryIcon}</span>
                        ) : null}
                        {tx.categoryName}
                      </Badge>
                    ) : null}
                  </div>

                  <span className="col-span-3 text-[11px] text-muted-foreground truncate pr-2">
                    {tx.type === "transfer"
                      ? `${tx.accountName} → ${tx.transferToName ?? "?"}`
                      : tx.accountName}
                  </span>

                  <span
                    className={`col-span-2 text-sm font-mono tabular-nums text-right whitespace-nowrap font-semibold ${amountClass(tx.type)}`}
                  >
                    {amountPrefix(tx.type)}
                    {formatIDR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile stacked rows */}
            <ul className="md:hidden divide-y divide-border">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                      {tx.type === "transfer" ? (
                        <>
                          <ArrowLeftRight size={10} />
                          Transfer → {tx.transferToName ?? "?"}
                        </>
                      ) : (
                        <>
                          {tx.categoryIcon ? (
                            <span aria-hidden>{tx.categoryIcon}</span>
                          ) : null}
                          {tx.categoryName ?? "Tanpa kategori"}
                        </>
                      )}
                      <span aria-hidden>·</span>
                      <span className="truncate">{tx.accountName}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {formatDateShort(tx.date)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-mono tabular-nums whitespace-nowrap shrink-0 font-semibold ${amountClass(tx.type)}`}
                  >
                    {amountPrefix(tx.type)}
                    {formatIDR(tx.amount)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer — only shown when more than 5 items exist */}
          {transactions.length > 5 && (
            <div className="px-5 py-2.5 border-t border-border bg-elevated/50 shrink-0">
              <Link
                to="/transactions"
                className="text-xs text-accent hover:underline"
              >
                Lihat semua {transactions.length} transaksi →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
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
