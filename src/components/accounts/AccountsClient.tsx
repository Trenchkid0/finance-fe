"use client";

import { useState, useTransition } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Wallet,
} from "lucide-react";
import { deleteAccount, toggleAccountActive } from "@/app/actions/accounts";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AccountForm,
  type AccountFormInitial,
} from "./AccountForm";
import type { AccountTypeInput } from "@/lib/utils/validators";

export interface AccountRowData {
  id: string;
  name: string;
  type: AccountTypeInput;
  balance: number;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  transactionCount: number;
}

interface Props {
  accounts: AccountRowData[];
}

export function AccountsClient({ accounts }: Props) {
  const { language } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRowData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AccountRowData | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);


  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {language === "id" ? "Akun Keuangan" : "Financial Accounts"}
          </h1>
          <p className="text-sm text-muted-foreground/80">
            {language === "id"
              ? "Kelola sumber dana Anda — bank, e-wallet, tunai, dan investasi."
              : "Manage your funding sources — bank, e-wallet, cash, and investments."}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="h-9 rounded-xl gap-2 text-xs font-semibold px-4 self-start sm:self-auto">
          <Plus size={14} strokeWidth={2.5} />
          {language === "id" ? "Tambah Akun Baru" : "Add New Account"}
        </Button>
      </div>

      {/* Summary cards strip */}
      {activeAccounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Total Saldo" : "Total Balance"}
            </p>
            <p className={cn("text-lg font-black font-mono tabular-nums", totalBalance >= 0 ? "text-income" : "text-expense")}>
              {formatIDR(totalBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Akun Aktif" : "Active Accounts"}
            </p>
            <p className="text-lg font-black font-mono tabular-nums text-foreground">
              {activeAccounts.length} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "akun" : "accounts"}</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Saldo Negatif" : "Negative Balance"}
            </p>
            <p className="text-lg font-black font-mono tabular-nums text-foreground">
              {accounts.filter((a) => a.isActive && a.balance < 0).length} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "akun" : "accounts"}</span>
            </p>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={language === "id" ? "Belum ada akun" : "No accounts yet"}
          description={
            language === "id"
              ? "Tambahkan akun pertama Anda untuk mulai mencatat transaksi."
              : "Add your first account to start recording transactions."
          }
          action={
            <Button onClick={() => setCreating(true)} className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
              <Plus size={14} strokeWidth={2.5} />
              {language === "id" ? "Tambah akun" : "Add account"}
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {/* Active Accounts */}
          {activeAccounts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-income" />
                {language === "id" ? "Akun Aktif" : "Active Accounts"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => setEditing(account)}
                    onDelete={() => setConfirmDelete(account)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactive Accounts */}
          {inactiveAccounts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-white/[0.2]" />
                {language === "id" ? "Nonaktif" : "Inactive"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inactiveAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => setEditing(account)}
                    onDelete={() => setConfirmDelete(account)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      {creating && (
        <AccountForm
          open={creating}
          onClose={() => setCreating(false)}
          mode="create"
          initial={{
            name: "",
            type: "bank",
            color: "#388BFD",
            icon: "",
            isActive: true,
          }}
          onSuccess={() => setCreating(false)}
        />
      )}

      {editing && (
        <AccountForm
          open={editing !== null}
          onClose={() => setEditing(null)}
          mode="edit"
          initial={toFormInitial(editing)}
          onSuccess={() => setEditing(null)}
        />
      )}

      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// --- Account Card Component (Physical Card Mockup) ------------------------

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountRowData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { language } = useLanguage();
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      void toggleAccountActive(account.id);
    });
  }

  const swatch = account.color ?? "#388BFD";
  const isNegative = account.balance < 0;
  const maskedNumber = `•••• •••• •••• ${account.id.slice(-4)}`;

  const typeLabel: Record<AccountTypeInput, string> = {
    bank: language === "id" ? "Bank" : "Bank",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    cash: language === "id" ? "Tunai" : "Cash",
    investment: language === "id" ? "Investasi" : "Investment",
  };

  return (
    <div className="relative group">
      {/* Physical Card Container */}
      <Link
        to={`/accounts/${account.id}`}
        className={cn(
          "relative block rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent p-6 pb-16 min-h-[210px] transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 overflow-hidden select-none cursor-pointer",
          !account.isActive && "opacity-40 grayscale"
        )}
      >
        {/* Dynamic swatch glow - Enhanced */}
        <div
          className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-[0.15] pointer-events-none transition-all duration-500 group-hover:opacity-30 group-hover:scale-125"
          style={{ backgroundColor: swatch }}
        />
        
        {/* Secondary glow for depth */}
        <div
          className="absolute -left-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-[0.08] pointer-events-none transition-all duration-500 group-hover:opacity-20"
          style={{ backgroundColor: swatch }}
        />

        {/* Card Header: Icon/Chip & Status */}
        <div className="flex items-start justify-between mb-6 relative z-10">
          {/* Institution Icon or EMV Chip */}
          {account.icon ? (
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] group-hover:scale-105">
              <span className="text-2xl">{account.icon}</span>
            </div>
          ) : (
            <div className="w-9 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 relative overflow-hidden flex flex-wrap p-0.5 opacity-80 shadow-inner">
              <div className="w-1/2 h-1/2 border-r border-b border-amber-500/30" />
              <div className="w-1/2 h-1/2 border-b border-amber-500/30" />
              <div className="w-1/2 h-1/2 border-r border-amber-500/30" />
              <div className="w-1/2 h-1/2" />
              <div className="absolute inset-1 border border-amber-500/10 pointer-events-none" />
            </div>
          )}
          
          {/* Account Type Badge */}
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
              style={{
                backgroundColor: `${swatch}15`,
                color: swatch,
                borderColor: `${swatch}30`
              }}
            >
              {typeLabel[account.type]}
            </span>
            {!account.isActive && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                {language === "id" ? "Nonaktif" : "Inactive"}
              </span>
            )}
          </div>
        </div>

        {/* Card Body: Balance & Card Number */}
        <div className="space-y-2 relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
            {language === "id" ? "Saldo Tersedia" : "Available Balance"}
          </p>
          <p className={cn(
            "text-3xl font-black font-mono tracking-tight tabular-nums transition-colors duration-300",
            isNegative ? "text-expense" : "text-foreground group-hover:text-white"
          )}>
            {formatIDR(account.balance)}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.2em] pt-1">
            {maskedNumber}
          </p>
        </div>

        {/* Card Footer: Holder Name & Transaction Count */}
        <div className="flex items-end justify-between border-t border-white/[0.06] pt-4 relative z-10">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold mb-1">
              {language === "id" ? "Pemegang Akun" : "Account Holder"}
            </p>
            <p className="text-sm font-bold text-foreground truncate tracking-wide transition-colors duration-300 group-hover:text-white">
              {account.name}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <svg className="w-3 h-3 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-mono text-muted-foreground/60 font-bold tabular-nums">
              {account.transactionCount}
            </span>
          </div>
        </div>
        
        {/* Hover shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent" />
        </div>
      </Link>

      {/* Floating Action Dropdown Menu - Outside Link */}
      <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="text-[10px] text-muted-foreground/40 font-mono">
            ID: {account.id.slice(-8)}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={language === "id" ? "Aksi akun" : "Account actions"}
                className="h-8 w-8 rounded-lg hover:bg-white/[0.12] bg-white/[0.04] border border-white/[0.08] text-muted-foreground/60 hover:text-foreground hover:border-white/[0.15] shrink-0 transition-all duration-200 backdrop-blur-md shadow-lg"
                disabled={pending}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl p-1">
              <DropdownMenuItem
                onSelect={onEdit}
                className="rounded-lg text-xs px-3 py-2 gap-2.5 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent active:scale-95"
              >
                <Pencil size={13} className="transition-transform duration-200 group-hover:scale-110" />
                <span className="font-medium">{language === "id" ? "Ubah" : "Edit"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleToggle}
                className="rounded-lg text-xs px-3 py-2 gap-2.5 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent active:scale-95"
              >
                {account.isActive ? (
                  <>
                    <PowerOff size={13} className="transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium">{language === "id" ? "Nonaktifkan" : "Deactivate"}</span>
                  </>
                ) : (
                  <>
                    <Power size={13} className="transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium">{language === "id" ? "Aktifkan" : "Activate"}</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
              <DropdownMenuItem
                variant="destructive"
                onSelect={onDelete}
                className="rounded-lg text-xs px-3 py-2 gap-2.5 cursor-pointer transition-all duration-200 hover:bg-expense/10 hover:text-expense focus:bg-expense/10 focus:text-expense active:scale-95"
              >
                <Trash2 size={13} className="transition-transform duration-200 group-hover:scale-110" />
                <span className="font-medium">{language === "id" ? "Hapus" : "Delete"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation --------------------------------------------------

function ConfirmDelete({
  target,
  onClose,
}: {
  target: AccountRowData | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(target.id);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? "Failed to delete account");
      }
    });
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{language === "id" ? "Hapus Akun" : "Delete Account"}</DialogTitle>
          <DialogDescription>
            {language === "id" ? "Tindakan ini tidak dapat dibatalkan." : "This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {target && (
            <>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-sm font-semibold text-foreground">
                  {target.name}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono tabular-nums">
                  {formatIDR(target.balance)} · {target.transactionCount} {language === "id" ? "transaksi" : "transactions"}
                </p>
              </div>

              {target.transactionCount > 0 && (
                <p className="text-xs text-warning/80">
                  {language === "id"
                    ? `Akun ini memiliki ${target.transactionCount} transaksi. Anda mungkin lebih baik menonaktifkannya saja.`
                    : `This account has ${target.transactionCount} transactions. You might want to deactivate it instead.`}
                </p>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending} className="rounded-xl">
            {language === "id" ? "Batal" : "Cancel"}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending} className="rounded-xl">
            {pending
              ? (language === "id" ? "Menghapus..." : "Deleting...")
              : (language === "id" ? "Hapus" : "Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toFormInitial(row: AccountRowData): AccountFormInitial {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    isActive: row.isActive,
  };
}
