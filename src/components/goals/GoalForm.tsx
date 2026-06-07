"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Target, Check, X, Loader2 } from "lucide-react";
import { formatIDR, formatInputRupiah, cleanMoneyString } from "@/lib/utils/formatters";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
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
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-11 border-border bg-elevated"
              />
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