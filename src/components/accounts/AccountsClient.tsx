"use client";

import { useState, useTransition } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { deleteAccount, toggleAccountActive } from "@/app/actions/accounts";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
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

const TYPE_LABEL: Record<AccountTypeInput, string> = {
  bank: "Bank",
  wallet: "E-wallet",
  cash: "Tunai",
  investment: "Investasi",
};

export function AccountsClient({ accounts }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRowData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AccountRowData | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Akun</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola sumber dana — bank, e-wallet, tunai, dan investasi.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1.5" />
          Tambah akun
        </Button>
      </div>

      {/* Summary cards strip */}
      {activeAccounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Saldo"
            amount={totalBalance}
            tone={totalBalance >= 0 ? "income" : "expense"}
            icon={<Wallet size={16} />}
          />
          <StatCard
            label="Akun Aktif"
            amount={activeAccounts.length}
            tone="neutral"
            icon={<Power size={16} />}
            isCurrency={false}
          />
          <StatCard
            label="Saldo Negatif"
            amount={accounts.filter((a) => a.isActive && a.balance < 0).length}
            tone={accounts.filter((a) => a.isActive && a.balance < 0).length > 0 ? "expense" : "neutral"}
            icon={<TrendingDown size={16} />}
            isCurrency={false}
          />
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada akun"
          description="Tambahkan akun pertama Anda untuk mulai mencatat transaksi."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} />
              Tambah akun
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Active Accounts */}
          {activeAccounts.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-income" />
                Akun Aktif
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
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                Nonaktif
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

      {/* Dialogs */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah akun</DialogTitle>
            <DialogDescription>
              Buat akun baru untuk melacak keuangan Anda
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <AccountForm
              mode="create"
              initial={{
                name: "",
                type: "bank",
                color: "#388BFD",
                icon: "",
                isActive: true,
              }}
              onSuccess={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah akun</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {editing && (
              <AccountForm
                mode="edit"
                initial={toFormInitial(editing)}
                onSuccess={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
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
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      void toggleAccountActive(account.id);
    });
  }

  const swatch = account.color ?? "#388BFD";
  const isNegative = account.balance < 0;
  const maskedNumber = `•••• •••• •••• ${account.id.slice(-4)}`;

  return (
    <div className="relative group">
      {/* Physical Card Container */}
      <Link
        to={`/accounts/${account.id}`}
        className={cn(
          "relative block rounded-xl border border-border bg-gradient-to-br from-[#1C2128] via-[#161B22] to-[#161B22] p-5 min-h-[195px] transition-all duration-200 hover:border-[#444C56] overflow-hidden select-none cursor-pointer",
          !account.isActive && "opacity-60"
        )}
      >
        {/* Dynamic swatch glow */}
        <div 
          className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none transition-all duration-300 group-hover:opacity-25" 
          style={{ backgroundColor: swatch }}
        />

        {/* Card Header: EMV Chip & Contactless */}
        <div className="flex items-center gap-2 mb-6">
          {/* EMV Chip */}
          <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 relative overflow-hidden flex flex-wrap p-0.5 opacity-90 shadow-inner">
            <div className="w-1/2 h-1/2 border-r border-b border-amber-500/30" />
            <div className="w-1/2 h-1/2 border-b border-amber-500/30" />
            <div className="w-1/2 h-1/2 border-r border-amber-500/30" />
            <div className="w-1/2 h-1/2" />
            <div className="absolute inset-1 border border-amber-500/10 pointer-events-none" />
          </div>
          
          {/* Contactless Signal */}
          <svg className="w-3.5 h-3.5 text-muted-foreground/50 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12a7 7 0 0 1 7-7" />
            <path d="M5 12a10 10 0 0 1 10-10" />
            <path d="M5 12a4 4 0 0 1 4-4" />
            <circle cx="5" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>

        {/* Card Body: Balance & Card Number */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Saldo Utama
          </p>
          <p className={cn(
            "text-2xl font-bold font-mono tabular-nums tracking-tight",
            isNegative ? "text-expense" : "text-foreground"
          )}>
            {formatIDR(account.balance)}
          </p>
          <p className="text-xs font-mono text-muted-foreground/40 tracking-widest pt-1">
            {maskedNumber}
          </p>
        </div>

        {/* Card Footer: Holder Name & Account Type Network */}
        <div className="flex items-end justify-between border-t border-border/40 pt-3 mt-4">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-0.5">
              Cardholder
            </p>
            <p className="text-xs font-semibold text-foreground truncate uppercase tracking-wide font-mono">
              {account.name}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border"
              style={{ 
                backgroundColor: `${swatch}12`, 
                color: swatch, 
                borderColor: `${swatch}25`
              }}
            >
              {TYPE_LABEL[account.type]}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground font-medium">
              {account.transactionCount} transaksi
            </span>
          </div>
        </div>
      </Link>

      {/* Floating Action Dropdown Menu */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi akun"
              className="h-7 w-7 rounded-md hover:bg-elevated text-muted-foreground hover:text-foreground shrink-0"
              disabled={pending}
            >
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil size={14} />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggle}>
              {account.isActive ? (
                <>
                  <PowerOff size={14} />
                  Nonaktifkan
                </>
              ) : (
                <>
                  <Power size={14} />
                  Aktifkan
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 size={14} />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {target && (
            <>
              <div className="p-3 rounded-lg bg-elevated border border-border">
                <p className="text-sm font-medium text-foreground">
                  {target.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono tabular-nums">
                  {formatIDR(target.balance)} · {target.transactionCount} transactions
                </p>
              </div>

              {target.transactionCount > 0 && (
                <p className="text-xs text-warning">
                  This account has {target.transactionCount} transactions. Consider deactivating instead.
                </p>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Helpers --------------------------------------------------------------

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

// Made with Bob
