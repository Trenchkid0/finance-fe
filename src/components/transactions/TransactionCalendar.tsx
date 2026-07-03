import { useState } from "react";
import { ArrowLeftRight, Calendar, ChevronLeft, ChevronRight, Inbox, Loader2, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "./TransactionForm";
import { ConfirmDelete } from "./ConfirmDelete";
import type { TransactionRowData } from "./TransactionsClient";
import type { AccountOption, CategoryOption, TransactionFormInitial } from "./TransactionForm";

interface TransactionCalendarProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  calendarTransactions: TransactionRowData[];
  calendarLoading: boolean;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
  aiScanEnabled: boolean;
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

export function TransactionCalendar({
  currentDate,
  setCurrentDate,
  calendarTransactions,
  calendarLoading,
  selectedDay,
  setSelectedDay,
  accounts,
  categories,
  aiScanEnabled,
}: TransactionCalendarProps) {
  const { language } = useLanguage();
  const [editing, setEditing] = useState<TransactionRowData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionRowData | null>(null);

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  const monthNamesID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthNamesEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const months = language === "id" ? monthNamesID : monthNamesEN;
  const dayNamesID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dayNamesEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysOfWeek = language === "id" ? dayNamesID : dayNamesEN;

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Card — takes 2 of 3 cols on lg */}
      <Card className="lg:col-span-2 overflow-hidden gap-0">
        {/* Header */}
        <div className="p-4 border-b border-border bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-accent h-4 w-4" />
            <h3 className="text-sm font-bold text-text-primary">
              {language === "id" ? "Kalender Arus Kas" : "Cash Flow Calendar"}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold min-w-[110px] text-center font-mono">
              {months[m]} {y}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-white/[0.005] text-center">
          {daysOfWeek.map((dayName) => (
            <div
              key={dayName}
              className="py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grid */}
        {calendarLoading ? (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-7 bg-[#30363D]/10 divide-x divide-y divide-border">
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
                      "min-h-[56px] sm:min-h-[70px] p-1.5 sm:p-2 flex flex-col justify-between items-stretch text-left border-t border-l border-border hover:bg-elevated/40 transition-all duration-150 relative group",
                      !cell.currentMonth && "opacity-30 bg-surface/30",
                      isSelected && "bg-accent/10 hover:bg-accent/15 ring-inset ring-1 ring-accent z-10",
                      data && data.count > 0 && !isSelected && "bg-elevated/10"
                    )}
                  >
                    {/* Left indicator bar */}
                    {data && data.count > 0 && (
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-[3px] rounded-r transition-all",
                        data.income > data.expense ? "bg-income/60" :
                        data.expense > data.income ? "bg-expense/50" :
                        "bg-accent/50"
                      )} />
                    )}

                    <div className="flex justify-between items-start z-10">
                      <span
                        className={cn(
                          "text-xs font-mono font-bold leading-none",
                          isToday
                            ? "bg-accent text-white size-5 rounded-full flex items-center justify-center -m-0.5"
                            : isSelected
                            ? "text-accent font-black"
                            : cell.currentMonth
                            ? "text-text-muted"
                            : "text-text-muted/40"
                        )}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Transaction count badge — visible on sm+ */}
                      {data && data.count > 0 && (
                        <span className={cn(
                          "text-[9px] font-bold px-1 py-0.5 rounded-full leading-none hidden sm:inline-flex",
                          "bg-accent/20 text-accent border border-accent/30"
                        )}>
                          {data.count}
                        </span>
                      )}
                    </div>

                    {/* Dot indicators on mobile, amounts on sm+ */}
                    {data && data.count > 0 && (
                      <div className="space-y-0.5 mt-auto">
                        {/* Mobile: just dots */}
                        <div className="flex gap-0.5 sm:hidden">
                          {data.income > 0 && <div className="size-1.5 rounded-full bg-income" />}
                          {data.expense > 0 && <div className="size-1.5 rounded-full bg-expense" />}
                          {data.hasTransfer && !data.income && !data.expense && <div className="size-1.5 rounded-full bg-accent" />}
                        </div>
                        {/* sm+: compact text amounts */}
                        <div className="hidden sm:block space-y-0.5">
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
                              <div className="text-[9px] font-mono text-accent font-bold">Transfer</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        )}
      </Card>

      {/* Right panel — detail card (like Recurring's sidebar) */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <Card className="p-5 flex flex-col min-h-[280px] gap-0">
          {selectedDay ? (() => {
            const dayTxs = calendarTransactions.filter((tx) => tx.date.slice(0, 10) === selectedDay);
            const dateParts = selectedDay.split("-");
            const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            const formattedDate = language === "id"
              ? `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`
              : `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

            return (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <Calendar size={13} className="text-accent" />
                    {formattedDate}
                  </h4>
                  <span className="text-xs font-mono bg-elevated border border-border px-2.5 py-0.5 rounded-lg text-text-muted">
                    {dayTxs.length} {language === "id" ? "Tx" : "Tx"}
                  </span>
                </div>

                {dayTxs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-text-muted">
                    <Inbox size={22} className="mb-2 opacity-30" />
                    <p className="text-xs">
                      {language === "id"
                        ? "Tidak ada transaksi pada tanggal ini."
                        : "No transactions on this day."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[420px]">
                    {dayTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-elevated/20 px-1.5 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0",
                            tx.type === "income"
                              ? "bg-income/10 text-income border border-income/20"
                              : tx.type === "expense"
                              ? "bg-expense/10 text-expense border border-expense/20"
                              : "bg-accent/10 text-accent border border-accent/20"
                          )}>
                            {tx.type === "transfer" ? <ArrowLeftRight size={13} /> : (tx.categoryIcon || "💰")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary leading-tight truncate">
                              {tx.description || (tx.type === "transfer" ? "Transfer Dana" : "Tanpa Deskripsi")}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-text-muted truncate">
                                {tx.accountName}
                              </span>
                              {tx.type !== "transfer" && tx.categoryName && (
                                <>
                                  <span className="text-[9px] text-text-muted/40">•</span>
                                  <span className="text-[10px] text-text-muted truncate">
                                    {tx.categoryName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
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
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setEditing(tx)}
                              className="p-1 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
                              title={language === "id" ? "Ubah" : "Edit"}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(tx)}
                              className="p-1 rounded hover:bg-expense/10 text-text-muted hover:text-expense transition-colors"
                              title={language === "id" ? "Hapus" : "Delete"}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-text-muted">
              <Calendar size={24} className="mb-2 opacity-30" />
              <p className="text-xs">
                {language === "id"
                  ? "Pilih tanggal pada kalender untuk melihat transaksi."
                  : "Select a date on the calendar to view transactions."}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Form */}
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

      {/* Delete Confirmation */}
      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
