import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Calendar, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormError } from '@/components/ui/form-error'
import { formatInputRupiah, cleanMoneyString } from '@/lib/utils/formatters'
import { useLanguage } from '@/lib/contexts/LanguageContext'

interface CategoryOption {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string | null
}

interface RecurringFormData {
  id?: string
  name: string
  amount: number
  categoryId?: string | null
  frequency: string
  dayOfMonth: number
  note?: string
}

interface RecurringFormProps {
  open: boolean
  onClose: () => void
  recurring?: RecurringFormData
  categories: CategoryOption[]
  onSubmit: (data: RecurringFormData) => Promise<void>
}

export function RecurringForm({ open, onClose, recurring, categories, onSubmit }: RecurringFormProps) {
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    name: recurring?.name || '',
    amountInput: recurring?.amount ? formatInputRupiah(String(recurring.amount)) : '',
    categoryId: recurring?.categoryId || '',
    frequency: recurring?.frequency || 'monthly',
    dayOfMonth: recurring?.dayOfMonth || 1,
    note: recurring?.note || '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError(language === 'id' ? 'Nama tagihan harus diisi' : 'Bill name is required')
      return
    }

    const amount = Number(cleanMoneyString(formData.amountInput))
    if (isNaN(amount) || amount <= 0) {
      setError(language === 'id' ? 'Nominal harus lebih besar dari 0' : 'Amount must be greater than 0')
      return
    }

    if (formData.dayOfMonth < 1 || formData.dayOfMonth > 31) {
      setError(language === 'id' ? 'Tanggal harus antara 1-31' : 'Day must be between 1-31')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...recurring,
        name: formData.name,
        amount,
        categoryId: formData.categoryId || null,
        frequency: formData.frequency,
        dayOfMonth: formData.dayOfMonth,
        note: formData.note,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'id' ? 'Gagal menyimpan' : 'Failed to save'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')

  if (typeof window === "undefined" || !open) return null;

  const isId = language === 'id';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl animate-fade-in-up"
        role="dialog"
        aria-modal="true"
      >
        {/* ===== STICKY HEADER ===== */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg animate-pulse-subtle">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {recurring?.id
                ? isId
                  ? "Ubah Tagihan Berulang"
                  : "Edit Recurring Bill"
                : isId
                  ? "Tambah Tagihan Berulang"
                  : "Add Recurring Bill"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Jadwalkan komitmen pembayaran berlangganan Anda."
                : "Schedule your monthly subscription services and bills."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label={isId ? "Tutup" : "Close"}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
          {/* ===== SCROLLABLE BODY ===== */}
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
            {error && <FormError>{error}</FormError>}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                {isId ? 'Nama Layanan / Tagihan' : 'Bill / Service Name'}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isId ? 'misal: Netflix Premium' : 'e.g. Netflix Premium'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? 'Nominal Tagihan' : 'Amount'}
                </Label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/45 select-none transition-colors duration-300 group-focus-within:text-foreground">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    value={formData.amountInput}
                    onChange={(e) => setFormData({ ...formData, amountInput: formatInputRupiah(e.target.value) })}
                    className="pl-9 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? 'Kategori' : 'Category'}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                    >
                      <span>
                        {(() => {
                          const selected = expenseCategories.find(cat => String(cat.id) === String(formData.categoryId));
                          if (!selected) return isId ? '-- Tanpa Kategori --' : '-- No Category --';
                          return `${selected.icon ? selected.icon + " " : ""}${selected.name}`;
                        })()}
                      </span>
                      <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                    <DropdownMenuItem
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => setFormData({ ...formData, categoryId: '' })}
                    >
                      {isId ? '-- Tanpa Kategori --' : '-- No Category --'}
                    </DropdownMenuItem>
                    {expenseCategories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        className="text-xs font-semibold cursor-pointer"
                        onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                      >
                        {cat.icon} {cat.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? 'Frekuensi' : 'Frequency'}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                    >
                      <span>
                        {formData.frequency === "weekly" ? (isId ? 'Mingguan' : 'Weekly') :
                         formData.frequency === "monthly" ? (isId ? 'Bulanan' : 'Monthly') :
                         formData.frequency === "yearly" ? (isId ? 'Tahunan' : 'Yearly') : formData.frequency}
                      </span>
                      <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[150px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                    <DropdownMenuItem
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => setFormData({ ...formData, frequency: 'weekly' })}
                    >
                      {isId ? 'Mingguan' : 'Weekly'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => setFormData({ ...formData, frequency: 'monthly' })}
                    >
                      {isId ? 'Bulanan' : 'Monthly'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => setFormData({ ...formData, frequency: 'yearly' })}
                    >
                      {isId ? 'Tahunan' : 'Yearly'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfMonth" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? 'Tanggal Jatuh Tempo' : 'Due Date'}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none font-mono"
                    >
                      <span>{formData.dayOfMonth}</span>
                      <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[100px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000] font-mono">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <DropdownMenuItem
                        key={day}
                        className="text-xs font-semibold cursor-pointer"
                        onClick={() => setFormData({ ...formData, dayOfMonth: day })}
                      >
                        {day}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                {isId ? 'Catatan' : 'Note'}
              </Label>
              <Textarea
                id="note"
                placeholder="..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
          </div>

          {/* ===== FOOTER ACTIONS ===== */}
          <div className="flex items-center gap-3 border-t border-border px-7 py-4">
            <Button type="submit" disabled={isSubmitting} className="h-10 flex-1 gap-2 text-xs font-semibold px-4">
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-1.5" />}
              {isId ? 'Simpan' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl px-5 text-xs font-semibold"
            >
              {isId ? 'Batal' : 'Cancel'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Made with Bob
