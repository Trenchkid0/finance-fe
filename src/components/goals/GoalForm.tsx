"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Target, Check, X, Loader2, Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatIDR, formatInputRupiah, cleanMoneyString } from "@/lib/utils/formatters";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountOption {
  id: string;
  name: string;
  balance: number;
}

export interface GoalFormData {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  accountId?: string | null;
  note?: string;
}

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  goal?: GoalFormData;
  accounts: AccountOption[];
  onSubmit: (data: GoalFormData) => Promise<void>;
}

const labelCls =
  "text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70";

export function GoalForm({ open, onClose, goal, accounts, onSubmit }: GoalModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // Reset state setiap kali modal dibuka
  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTargetAmount(goal?.targetAmount ? formatInputRupiah(String(goal.targetAmount)) : "");
    setCurrentAmount(goal?.currentAmount ? formatInputRupiah(String(goal.currentAmount)) : "");
    setTargetDate(goal?.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "");
    setAccountId(goal?.accountId ?? "");
    setNote(goal?.note ?? "");
    setError("");
  }, [open, goal]);

  // Esc untuk tutup + kunci scroll body
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const progress = useMemo(() => {
    const target = Number(cleanMoneyString(targetAmount));
    const current = Number(cleanMoneyString(currentAmount));
    if (!target || target <= 0 || isNaN(target) || isNaN(current)) return null;
    const pct = Math.min(100, Math.max(0, (current / target) * 100));
    return { target, current, pct };
  }, [targetAmount, currentAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(isId ? "Nama target harus diisi" : "Goal name is required");
      return;
    }
    const target = Number(cleanMoneyString(targetAmount));
    if (isNaN(target) || target <= 0) {
      setError(isId ? "Target nominal harus lebih besar dari 0" : "Target amount must be greater than 0");
      return;
    }
    const current = Number(cleanMoneyString(currentAmount));
    if (isNaN(current) || current < 0) {
      setError(isId ? "Nominal terkumpul tidak valid" : "Current amount is invalid");
      return;
    }
    if (!targetDate) {
      setError(isId ? "Tanggal target harus diisi" : "Target date is required");
      return;
    }

    setPending(true);
    try {
      await onSubmit({
        ...goal,
        name,
        targetAmount: target,
        currentAmount: current,
        targetDate,
        accountId: accountId || null,
        note,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isId ? "Gagal menyimpan" : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl">
        {/* ---- Header ---- */}
        <div className="flex flex-none items-start gap-3.5 border-b border-border bg-gradient-to-b from-white/[0.03] to-transparent px-7 py-5">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/30">
            <Target className="h-[22px] w-[22px] text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight tracking-tight">
              {goal
                ? isId ? "Ubah Target Tabungan" : "Edit Savings Goal"
                : isId ? "Target Tabungan Baru" : "New Savings Goal"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/60">
              {isId ? "Ukur dan lacak tujuan finansialmu." : "Measure and track your financial objectives."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 flex-none rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-white/[0.07] hover:text-foreground"
            aria-label={isId ? "Tutup" : "Close"}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* ---- Body (scrollable) ---- */}
        <form id="goal-form" onSubmit={handleSubmit} noValidate className="flex-1 space-y-[18px] overflow-y-auto px-7 py-6">
          {/* Nama target */}
          <div className="space-y-2.5">
            <Label htmlFor="name" className={labelCls}>
              {isId ? "Nama Target" : "Goal Name"}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isId ? "Mis. Beli Laptop Baru" : "e.g. New Laptop"}
              className="h-11 border-border bg-elevated"
            />
          </div>

          {/* Nominal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label htmlFor="targetAmount" className={labelCls}>
                {isId ? "Target Nominal" : "Target Amount"}
              </Label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-xs font-bold text-muted-foreground/45 transition-colors duration-300 group-focus-within:text-foreground">
                  Rp
                </span>
                <Input
                  id="targetAmount"
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(formatInputRupiah(e.target.value))}
                  className="h-11 border-border bg-elevated pl-10 font-mono font-semibold tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="currentAmount" className={labelCls}>
                {isId ? "Terkumpul Saat Ini" : "Currently Saved"}
              </Label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-xs font-bold text-muted-foreground/45 transition-colors duration-300 group-focus-within:text-foreground">
                  Rp
                </span>
                <Input
                  id="currentAmount"
                  type="text"
                  inputMode="numeric"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatInputRupiah(e.target.value))}
                  className="h-11 border-border bg-elevated pl-10 font-mono font-semibold tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Progress preview */}
          {progress ? (
            <div className="space-y-2.5 rounded-xl border border-border bg-elevated p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  <Target size={13} className="text-accent" />
                  Progress
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {progress.pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-progress transition-all duration-500"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground/50">
                {formatIDR(progress.current)} / {formatIDR(progress.target)}
              </p>
            </div>
          ) : null}

          {/* Tanggal & akun */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label htmlFor="targetDate" className={labelCls}>
                {isId ? "Tanggal Target" : "Target Date"}
              </Label>
              <CustomSingleDatePicker value={targetDate} onChange={setTargetDate} />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="accountId" className={labelCls}>
                {isId ? "Hubungkan ke Akun (Opsional)" : "Linked Account (Optional)"}
              </Label>
              <Select value={accountId || "none"} onValueChange={(v) => setAccountId(v === "none" ? "" : v)}>
                <SelectTrigger id="accountId" className="h-11 border-border bg-elevated">
                  <SelectValue placeholder={isId ? "Pilih rekening" : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isId ? "Tanpa rekening" : "No account"}</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({formatIDR(a.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-2.5">
            <Label htmlFor="note" className={labelCls}>
              {isId ? "Catatan (opsional)" : "Note (optional)"}
            </Label>
            <Textarea
              id="note"
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isId ? "Mis. Sisihkan dari bonus tahunan" : "e.g. Save from annual bonus"}
              className="min-h-[80px] resize-none border-border bg-elevated"
            />
          </div>

          {error ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </p>
          ) : null}
        </form>

        {/* ---- Footer (sticky) ---- */}
        <div className="flex flex-none items-center gap-3 border-t border-border bg-surface px-7 py-5">
          <Button
            type="submit"
            form="goal-form"
            disabled={pending}
            className="h-11 flex-1 gap-2 text-[13px] font-bold"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {pending
              ? isId ? "Menyimpan…" : "Saving…"
              : goal
              ? isId ? "Simpan Perubahan" : "Save Changes"
              : isId ? "Tambah Target" : "Add Goal"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
            className="h-11 border border-border bg-white/[0.04] px-6 text-[13px] hover:bg-white/[0.08]"
          >
            {isId ? "Batal" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}


function CustomSingleDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() => {
    const currentYear = value ? new Date(value).getFullYear() : new Date().getFullYear();
    return Math.floor(currentYear / 16) * 16;
  });

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 460;
      
      let top = triggerRect.bottom + window.scrollY + 8;
      let left = triggerRect.left + window.scrollX;
      
      if (top + popupHeight > window.scrollY + window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top + window.scrollY - popupHeight - 8;
      }
      
      if (left + 280 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 290);
      }
      
      if (left < 10) {
        left = 10;
      }
      
      containerRef.current.style.top = `${top}px`;
      containerRef.current.style.left = `${left}px`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      const contentEl = document.getElementById("goal-date-picker-content");
      if (contentEl && contentEl.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  useEffect(() => {
    const vYear = viewDate.getFullYear();
    setYearPageStart(Math.floor(vYear / 16) * 16);
  }, [viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  let startOffset = new Date(year, month, 1).getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev - 16);
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev + 16);
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatFriendlyDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const label = value ? formatFriendlyDate(value) : (language === "id" ? "Pilih Tanggal" : "Select Date");

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-full justify-between px-3.5 text-sm text-text-primary bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06] active:bg-white/[0.08] rounded-lg transition-all font-mono"
      >
        <span className="flex items-center gap-2.5">
          <Calendar size={16} className="text-accent opacity-70" />
          <span className="font-medium">{label}</span>
        </span>
        <ChevronDown size={16} className={cn("text-text-muted opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            id="goal-date-picker-content"
            style={{
              position: "fixed",
              top: "0",
              left: "0",
            }}
            className="p-4 w-[280px] rounded-xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col gap-3.5 text-text-primary shadow-2xl z-[99999]"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                {viewMode === "years" ? (
                  <span className="px-1.5 py-0.5 text-xs font-bold text-text-primary font-mono">
                    {yearPageStart} — {yearPageStart + 15}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode(viewMode === "months" ? "days" : "months");
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors",
                        viewMode === "months" && "bg-white/[0.08] text-accent hover:text-accent"
                      )}
                    >
                      {[
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ][month].substring(0, 3)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode("years");
                      }}
                      className="px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors font-mono"
                    >
                      {year}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={viewMode === "months"}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={viewMode === "months"}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {viewMode === "days" && (
              <>
                <div className="grid grid-cols-7 text-center">
                  {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, idx) => (
                    <span key={idx} className="text-[9px] font-bold text-text-muted uppercase">
                      {day}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-mono">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-7 w-7" />;
                    }

                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = value === dateStr;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={(e) => handleDayClick(day, e)}
                        className={cn(
                          "h-8 w-8 text-xs rounded-lg flex items-center justify-center font-semibold transition-all cursor-pointer",
                          isSelected 
                            ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" 
                            : isToday
                            ? "border border-accent/50 text-accent font-bold"
                            : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-2 py-1">
                {[
                  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                ].map((m, mIdx) => (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(year, mIdx, 1));
                      setViewMode("days");
                    }}
                    className={cn(
                      "h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center",
                      mIdx === month 
                        ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" 
                        : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]"
                    )}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {viewMode === "years" && (
              <div className="grid grid-cols-4 gap-2 py-1">
                {Array.from({ length: 16 }, (_, i) => yearPageStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(y, month, 1));
                      setViewMode("days");
                    }}
                    className={cn(
                      "h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center font-mono",
                      y === year 
                        ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" 
                        : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
