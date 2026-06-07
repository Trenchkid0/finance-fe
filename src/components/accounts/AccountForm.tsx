"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createAccount, updateAccount } from "@/app/actions/accounts";
import { formatInputRupiah } from "@/lib/utils/formatters";
import type { ActionResult } from "@/types";
import type { AccountTypeInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountFormInitial {
  id?: string;
  name: string;
  type: AccountTypeInput;
  color: string | null;
  icon: string | null;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: AccountFormInitial;
  onSuccess: () => void;
}

const COLOR_SWATCHES = [
  "#388BFD",
  "#2EA043",
  "#D29922",
  "#F85149",
  "#A371F7",
  "#39D353",
  "#8B949E",
] as const;

export function AccountForm({ open, onClose, mode, initial, onSuccess }: Props) {
  const { language } = useLanguage();
  const [color, setColor] = useState<string>(initial.color ?? COLOR_SWATCHES[0]);
  const [type, setType] = useState<AccountTypeInput>(initial.type);
  const [icon, setIcon] = useState<string>(initial.icon && initial.icon !== "" ? initial.icon : "none");
  const [startingBalance, setStartingBalance] = useState<string>("0");

  const financialIcons = [
    { value: "none", label: language === "id" ? "Tanpa ikon" : "No icon", emoji: "" },
    { value: "🏦", label: language === "id" ? "Bank Umum" : "General Bank", emoji: "🏦" },
    { value: "💳", label: language === "id" ? "Kartu Kredit/Debit" : "Credit/Debit Card", emoji: "💳" },
    { value: "💰", label: language === "id" ? "Tabungan" : "Savings", emoji: "💰" },
    { value: "💵", label: language === "id" ? "Tunai" : "Cash", emoji: "💵" },
    { value: "📱", label: language === "id" ? "E-Wallet/Digital" : "E-Wallet/Digital", emoji: "📱" },
    { value: "🏧", label: language === "id" ? "ATM" : "ATM", emoji: "🏧" },
    { value: "📊", label: language === "id" ? "Investasi" : "Investment", emoji: "📊" },
    { value: "💎", label: language === "id" ? "Aset Premium" : "Premium Asset", emoji: "💎" },
    { value: "🪙", label: language === "id" ? "Kripto" : "Crypto", emoji: "🪙" },
    { value: "🏠", label: language === "id" ? "Properti" : "Property", emoji: "🏠" },
    { value: "🚗", label: language === "id" ? "Kendaraan" : "Vehicle", emoji: "🚗" },
    { value: "💼", label: language === "id" ? "Bisnis" : "Business", emoji: "💼" },
    { value: "🎯", label: language === "id" ? "Target/Goal" : "Goal/Target", emoji: "🎯" },
    { value: "🔒", label: language === "id" ? "Dana Darurat" : "Emergency Fund", emoji: "🔒" },
  ];

  const typeOptions: { value: AccountTypeInput; label: string }[] = [
    { value: "bank", label: language === "id" ? "Bank" : "Bank" },
    { value: "wallet", label: language === "id" ? "E-wallet" : "E-wallet" },
    { value: "cash", label: language === "id" ? "Tunai" : "Cash" },
    { value: "investment", label: language === "id" ? "Investasi" : "Investment" },
  ];

  const action =
    mode === "edit" && initial.id
      ? updateAccount.bind(null, initial.id)
      : createAccount;

  const [state, formAction, pending] = useActionState<
    ActionResult<null> | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok) onSuccess();
    return result;
  }, undefined);

  if (typeof window === "undefined" || !open) return null;

  const isId = language === "id";

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
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {mode === "create"
                ? isId
                  ? "Tambah Akun"
                  : "Add Account"
                : isId
                  ? "Edit Akun"
                  : "Edit Account"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Buat atau ubah akun untuk melacak keuangan Anda."
                : "Create or edit an account to track your finances."}
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

        <form action={formAction} className="flex flex-1 flex-col overflow-hidden" noValidate>
          {/* ===== SCROLLABLE BODY ===== */}
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
            {/* Nama Akun */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                {isId ? "Nama akun" : "Account name"}
              </Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={80}
                defaultValue={initial.name}
                placeholder={isId ? "Mis. BCA Tahapan, GoPay, Tunai" : "e.g. Savings Account, E-Wallet, Cash"}
                aria-invalid={!!state?.fieldErrors?.name}
              />
              {state?.fieldErrors?.name?.[0] ? (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {state.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>

            {/* Tipe Akun (Segmented Grid) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                {isId ? "Tipe akun" : "Account type"}
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {typeOptions.map((opt) => {
                  const isSelected = type === opt.value;
                  const emoji = opt.value === "bank" ? "🏦" : opt.value === "wallet" ? "📱" : opt.value === "cash" ? "💵" : "📊";
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 outline-none",
                        isSelected
                          ? "border-accent bg-accent/[0.08] shadow-[0_0_15px_rgba(56,139,253,0.15)] text-foreground font-bold"
                          : "border-white/[0.06] bg-white/[0.01] text-muted-foreground/70 hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-foreground"
                      )}
                    >
                      <span className="text-lg" aria-hidden>{emoji}</span>
                      <span className="text-[13px] tracking-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="type" value={type} />
              {state?.fieldErrors?.type?.[0] ? (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {state.fieldErrors.type[0]}
                </p>
              ) : null}
            </div>

            {/* Ikon & Warna Aksen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ikon Institusi */}
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? "Ikon Institusi" : "Institution Icon"}
                </Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger id="icon" aria-invalid={!!state?.fieldErrors?.icon}>
                    <SelectValue placeholder={isId ? "Pilih ikon" : "Select icon"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {financialIcons.map((opt) => (
                      <SelectItem
                        key={opt.value || "empty"}
                        value={opt.value}
                      >
                        <span className="flex items-center gap-2">
                          {opt.emoji && <span className="text-base" aria-hidden>{opt.emoji}</span>}
                          <span>{opt.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="icon" value={icon} />
                {state?.fieldErrors?.icon?.[0] ? (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {state.fieldErrors.icon[0]}
                  </p>
                ) : null}
              </div>

              {/* Warna Aksen */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider block">
                  {isId ? "Warna Aksen" : "Accent Color"}
                </Label>
                <div className="flex items-center gap-2.5 h-11 px-1">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      aria-label={isId ? `Pilih warna ${c}` : `Select color ${c}`}
                      aria-pressed={color === c}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-300 relative flex items-center justify-center outline-none",
                        "hover:scale-110 active:scale-95"
                      )}
                      style={{ 
                        background: c,
                        boxShadow: color === c 
                          ? `0 0 0 2px #121214, 0 0 0 4px ${c}, 0 4px 10px ${c}50` 
                          : "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  ))}
                </div>
                <input type="hidden" name="color" value={color} />
              </div>
            </div>

            {/* Saldo Awal / Status Aktif */}
            {mode === "create" ? (
              <div className="space-y-2">
                <Label htmlFor="startingBalance" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {isId ? "Saldo awal" : "Starting balance"}
                </Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/45 select-none transition-colors duration-300 group-focus-within:text-foreground">
                    Rp
                  </span>
                  <Input
                    id="startingBalance"
                    name="startingBalance"
                    type="text"
                    inputMode="numeric"
                    required
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(formatInputRupiah(e.target.value))}
                    className="pl-10 font-mono font-semibold"
                    aria-invalid={!!state?.fieldErrors?.startingBalance}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/50">
                  {isId
                    ? "Saldo akan dihitung secara kumulatif dari transaksi setelah ini."
                    : "The balance will be calculated cumulatively from subsequent transactions."}
                </p>
                {state?.fieldErrors?.startingBalance?.[0] ? (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {state.fieldErrors.startingBalance[0]}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] flex items-center">
                <label className="flex items-center gap-2.5 text-sm text-foreground/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={initial.isActive}
                    className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.02] text-accent focus:ring-accent/30 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[13px] text-foreground">
                      {isId ? "Akun aktif" : "Active account"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {isId
                        ? "Akun nonaktif disembunyikan dari dashboard utama."
                        : "Inactive accounts are hidden from the main dashboard."}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {state?.error ? (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {state.error}
              </p>
            ) : null}
          </div>

          {/* ===== FOOTER ACTIONS ===== */}
          <div className="flex items-center gap-3 border-t border-border px-7 py-4">
            <Button type="submit" disabled={pending} className="h-10 flex-1 gap-2 text-xs font-semibold px-4">
              {pending && <Loader2 size={14} className="animate-spin mr-1.5" />}
              {mode === "edit"
                ? (isId ? "Simpan Perubahan" : "Save Changes")
                : (isId ? "Tambah Akun Baru" : "Add New Account")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={pending}
              className="h-10 rounded-xl px-5 text-xs font-semibold"
            >
              {isId ? "Batal" : "Cancel"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
