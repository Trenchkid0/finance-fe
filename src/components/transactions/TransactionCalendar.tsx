import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/utils/formatters'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { cn } from '@/lib/utils/cn'

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string
  description: string
  categoryName: string | null
  categoryIcon: string | null
}

interface TransactionCalendarProps {
  transactions: Transaction[]
  onTransactionClick?: (transaction: Transaction) => void
}

export function TransactionCalendar({ transactions, onTransactionClick }: TransactionCalendarProps) {
  const { language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Days in current month
  const totalDays = new Date(year, month + 1, 0).getDate()
  // Weekday offset of 1st day of month (0 = Sunday, 1 = Monday, etc.)
  let startOffset = new Date(year, month, 1).getDay()
  // Adjust offset to make Monday first (0 = Mon, 1 = Tue, ..., 6 = Sun)
  startOffset = startOffset === 0 ? 6 : startOffset - 1

  // Generate calendar grid array
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d)
  }

  // Get transactions for a specific day
  const getTransactionsForDay = (dayNum: number): Transaction[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return transactions.filter(tx => tx.date.startsWith(dateStr))
  }

  // Calculate daily totals
  const getDayTotals = (dayNum: number) => {
    const dayTransactions = getTransactionsForDay(dayNum)
    const income = dayTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const expense = dayTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    return { income, expense, net: income - expense, count: dayTransactions.length }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const monthLabel = currentDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })

  const selectedDayTransactions = selectedDay ? getTransactionsForDay(selectedDay) : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-surface overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-border bg-white/[0.01] flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-white/[0.005] text-center">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => (
            <span
              key={idx}
              className="py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >
              {language === 'id' ? day : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
            </span>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-[#30363D]/10 divide-x divide-y divide-border">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[90px] bg-white/[0.005] border-t border-l border-border"
                />
              )
            }

            const { income, expense, net, count } = getDayTotals(day)
            const isSelected = selectedDay === day
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'min-h-[90px] p-2 flex flex-col justify-between cursor-pointer transition-colors border-t border-l border-border relative',
                  isSelected
                    ? 'bg-accent/10 hover:bg-accent/15'
                    : 'hover:bg-elevated/40'
                )}
              >
                {count > 0 && (
                  <div className={cn(
                    'absolute left-0 top-0 bottom-0 w-[3px] rounded-r',
                    net > 0 ? 'bg-income/50' : net < 0 ? 'bg-expense/50' : 'bg-accent/50'
                  )} />
                )}
                
                <div className="flex justify-between items-start z-10">
                  <span
                    className={cn(
                      'text-xs font-mono font-bold leading-none',
                      isToday
                        ? 'bg-accent text-white size-5 rounded-full flex items-center justify-center -m-1'
                        : isSelected
                        ? 'text-accent font-black'
                        : 'text-text-muted'
                    )}
                  >
                    {day}
                  </span>

                  {count > 0 && (
                    <span className="text-[9px] font-bold text-text-muted bg-elevated border border-border px-1 rounded">
                      {count}
                    </span>
                  )}
                </div>

                {/* Daily summary */}
                {count > 0 && (
                  <div className="mt-1 space-y-0.5 text-[9px] font-mono tabular-nums">
                    {income > 0 && (
                      <div className="text-income truncate">+{formatIDR(income, { compact: true })}</div>
                    )}
                    {expense > 0 && (
                      <div className="text-expense truncate">-{formatIDR(expense, { compact: true })}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <CalendarIcon size={13} className="text-accent" />
              {selectedDay
                ? `${language === 'id' ? 'TANGGAL' : 'DAY'} ${selectedDay} ${monthLabel.split(' ')[0]}`
                : language === 'id' ? 'PILIH TANGGAL' : 'SELECT A DAY'}
            </h3>
          </div>

          {selectedDay === null ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-text-muted">
              <CalendarIcon size={24} className="mb-2 opacity-50" />
              <p className="text-xs">
                {language === 'id'
                  ? 'Pilih tanggal pada kalender untuk melihat transaksi.'
                  : 'Select a date on the calendar to see transactions.'}
              </p>
            </div>
          ) : selectedDayTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-text-muted">
              <CalendarIcon size={24} className="mb-2 opacity-40" />
              <p className="text-xs font-medium">
                {language === 'id'
                  ? 'Tidak ada transaksi pada tanggal ini.'
                  : 'No transactions on this day.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {selectedDayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onTransactionClick?.(tx)}
                  className="p-3 rounded-lg border border-border bg-elevated/40 hover:bg-elevated transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {tx.categoryIcon && (
                          <span className="text-sm">{tx.categoryIcon}</span>
                        )}
                        <h4 className="text-xs font-bold text-text-primary leading-tight truncate">
                          {tx.description || tx.categoryName || 'Transaction'}
                        </h4>
                      </div>
                      {tx.categoryName && (
                        <span className="text-[9px] text-text-muted">
                          {tx.categoryName}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-black font-mono tabular-nums whitespace-nowrap',
                        tx.type === 'income'
                          ? 'text-income'
                          : tx.type === 'expense'
                          ? 'text-expense'
                          : 'text-accent'
                      )}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatIDR(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
