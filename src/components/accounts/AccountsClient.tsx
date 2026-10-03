import { useState, useTransition, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Wallet,
  GripVertical,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { deleteAccount, toggleAccountActive } from "@/app/actions/accounts";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useApp } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
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
import { getCurrentPreferences, savePreferences } from "@/lib/preferences";

export interface AccountRowData {
  id: string;
  name: string;
  type: AccountTypeInput;
  balance: number;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
  transactionCount?: number;
}

interface Props {
  accounts: AccountRowData[];
}

const STORAGE_KEY = "racks_accounts_order_ids";

function getSavedOrder(): string[] {
  // First check in-memory / backend synced preferences
  const prefOrder = getCurrentPreferences().accountOrder;
  if (prefOrder && prefOrder.length > 0) return prefOrder;

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function applySavedOrder(list: AccountRowData[]): AccountRowData[] {
  const savedIds = getSavedOrder();
  if (savedIds.length === 0) return list;

  const idMap = new Map(savedIds.map((id, idx) => [id, idx]));
  return [...list].sort((a, b) => {
    const idxA = idMap.has(a.id) ? idMap.get(a.id)! : 9999;
    const idxB = idMap.has(b.id) ? idMap.get(b.id)! : 9999;
    return idxA - idxB;
  });
}

export function AccountsClient({ accounts }: Props) {
  const { language } = useLanguage();
  const { refresh } = useApp();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRowData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AccountRowData | null>(null);

  // Ordered accounts state (persisted via localStorage AND backend preferences)
  const [orderedAccounts, setOrderedAccounts] = useState<AccountRowData[]>(() =>
    applySavedOrder(accounts)
  );

  // Drag and Drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"before" | "after" | null>(null);
  const [hasCustomOrder, setHasCustomOrder] = useState<boolean>(() => getSavedOrder().length > 0);

  // Ref to suppress click navigation while dragging
  const isDraggingRef = useRef(false);
  const touchDraggedIdRef = useRef<string | null>(null);

  // Sync with prop changes while preserving order
  useEffect(() => {
    setOrderedAccounts(applySavedOrder(accounts));
    setHasCustomOrder(getSavedOrder().length > 0);
  }, [accounts]);

  const activeAccounts = orderedAccounts.filter((a) => a.isActive);
  const inactiveAccounts = orderedAccounts.filter((a) => !a.isActive);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);

  // Commit order to both localStorage AND backend database for cross-device sync
  const commitNewOrder = (newList: AccountRowData[]) => {
    const orderIds = newList.map((a) => a.id);
    
    // 1. Save to local storage for instant local response
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
    } catch { /* ignore */ }

    // 2. Sync to backend database via UserPreferences
    const curPrefs = getCurrentPreferences();
    savePreferences({
      ...curPrefs,
      accountOrder: orderIds,
    });

    setOrderedAccounts(newList);
    setHasCustomOrder(true);
  };

  // Handle Desktop Drag Start
  const handleDragStart = (id: string, e: React.DragEvent) => {
    isDraggingRef.current = true;
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle Desktop Drag Over a target account card
  const handleDragOver = (targetId: string, position: "before" | "after", e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId !== targetId) {
      setDragOverId(targetId);
      setDragOverPosition(position);
    }
  };

  // Handle Desktop Drag Leave
  const handleDragLeave = (targetId: string) => {
    if (dragOverId === targetId) {
      setDragOverId(null);
      setDragOverPosition(null);
    }
  };

  // Handle Drop on an account card
  const handleDrop = async (targetId: string) => {
    const sourceId = draggedId || touchDraggedIdRef.current;
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      setDragOverPosition(null);
      return;
    }

    const currentList = [...orderedAccounts];
    const sourceIndex = currentList.findIndex((a) => a.id === sourceId);
    const targetIndex = currentList.findIndex((a) => a.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      setDragOverPosition(null);
      return;
    }

    const draggedItem = currentList[sourceIndex];
    const targetItem = currentList[targetIndex];

    // If dragged between active and inactive groups, update active status seamlessly
    if (draggedItem.isActive !== targetItem.isActive) {
      draggedItem.isActive = targetItem.isActive;
      toggleAccountActive(draggedItem.id);
    }

    // Remove source item
    currentList.splice(sourceIndex, 1);
    // Find new target position
    const adjustedTargetIndex = currentList.findIndex((a) => a.id === targetId);
    const insertIndex = dragOverPosition === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    currentList.splice(insertIndex, 0, draggedItem);

    // Commit and sync cross-device
    commitNewOrder(currentList);

    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);

    toast.success(
      language === "id"
        ? `Posisi akun "${draggedItem.name}" berhasil diatur dan disinkronkan ke seluruh perangkat!`
        : `Account "${draggedItem.name}" repositioned and synced cross-device!`
    );
  };

  // Handle Drag End
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  // Mobile Touch Drag Handlers
  const handleTouchStart = (id: string) => {
    isDraggingRef.current = true;
    touchDraggedIdRef.current = id;
    setDraggedId(id);
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!touchDraggedIdRef.current) return;
    
    // Find element under touch point
    const el = document.elementFromPoint(clientX, clientY);
    const cardEl = el?.closest("[data-account-id]") as HTMLElement | null;
    if (!cardEl) return;

    const targetId = cardEl.getAttribute("data-account-id");
    if (!targetId || targetId === touchDraggedIdRef.current) return;

    const rect = cardEl.getBoundingClientRect();
    const isAfter = clientY > rect.top + rect.height / 2;
    setDragOverId(targetId);
    setDragOverPosition(isAfter ? "after" : "before");
  };

  const handleTouchEnd = () => {
    if (touchDraggedIdRef.current && dragOverId) {
      handleDrop(dragOverId);
    }
    touchDraggedIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  // Quick move step for touch / mobile users
  const handleQuickMove = (id: string, direction: "up" | "down") => {
    const currentList = [...orderedAccounts];
    const index = currentList.findIndex((a) => a.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    commitNewOrder(currentList);
    toast.success(
      language === "id"
        ? `Posisi "${temp.name}" dipindahkan ${direction === "up" ? "ke atas" : "ke bawah"}!`
        : `Moved "${temp.name}" ${direction}!`
    );
  };

  // Reset custom order to original default
  const handleResetOrder = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }

    // Clear backend preference
    const curPrefs = getCurrentPreferences();
    savePreferences({
      ...curPrefs,
      accountOrder: [],
    });

    setOrderedAccounts(accounts);
    setHasCustomOrder(false);
    toast.success(
      language === "id"
        ? "Urutan kartu akun telah di-reset ke bawaan."
        : "Account cards order reset to default."
    );
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
              {language === "id" ? "Akun Keuangan" : "Financial Accounts"}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-accent bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded-full">
              <GripVertical size={11} className="text-accent" />
              {language === "id" ? "Drag & drop (Laptop & HP)" : "Drag & drop (Cross-device)"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground/80">
            {language === "id"
              ? "Kelola sumber dana Anda — bank, e-wallet, tunai, dan investasi. Urutan kartu otomatis tersinkronisasi di laptop dan HP."
              : "Manage your funding sources. Card order automatically syncs across your laptop and smartphone."}
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasCustomOrder && (
            <Button
              variant="outline"
              onClick={handleResetOrder}
              className="h-9 rounded-xl gap-1.5 text-xs font-semibold px-3 text-muted-foreground hover:text-foreground border-border/60 hover:bg-elevated/40"
              title={language === "id" ? "Kembalikan ke urutan awal" : "Reset cards to default order"}
            >
              <RotateCcw size={13} />
              <span>{language === "id" ? "Reset Urutan" : "Reset Order"}</span>
            </Button>
          )}
          <Button onClick={() => setCreating(true)} className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
            <Plus size={14} strokeWidth={2.5} />
            {language === "id" ? "Tambah Akun Baru" : "Add New Account"}
          </Button>
        </div>
      </div>

      {/* Summary cards strip */}
      {activeAccounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            className="relative overflow-hidden p-4 gap-0 border backdrop-blur-sm transition-all duration-300 hover:border-accent/30"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 4%, transparent)",
            }}
          >
            {/* Sci-fi Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/20 rounded-tl" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/20 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/20 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/20 rounded-br" />

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Total Saldo" : "Total Balance"}
            </p>
            <p className={cn("text-lg font-black font-mono tabular-nums", totalBalance >= 0 ? "text-income" : "text-expense")}>
              {formatIDR(totalBalance)}
            </p>
          </Card>
          <Card className="relative overflow-hidden p-4 gap-0 border border-border/40 bg-elevated/5 backdrop-blur-sm transition-all duration-300 hover:border-accent/25">
            {/* Sci-fi Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/15 rounded-tl" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/15 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/15 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/15 rounded-br" />

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Akun Aktif" : "Active Accounts"}
            </p>
            <p className="text-lg font-black font-mono tabular-nums text-foreground">
              {activeAccounts.length} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "akun" : "accounts"}</span>
            </p>
          </Card>
          <Card className="relative overflow-hidden p-4 gap-0 border border-border/40 bg-elevated/5 backdrop-blur-sm transition-all duration-300 hover:border-accent/25">
            {/* Sci-fi Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/15 rounded-tl" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/15 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/15 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/15 rounded-br" />

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {language === "id" ? "Saldo Negatif" : "Negative Balance"}
            </p>
            <p className="text-lg font-black font-mono tabular-nums text-foreground">
              {accounts.filter((a) => a.isActive && a.balance < 0).length} <span className="text-xs text-muted-foreground/60 font-sans font-semibold ml-1">{language === "id" ? "akun" : "accounts"}</span>
            </p>
          </Card>
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
          {/* Active Accounts Grid */}
          {activeAccounts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em] flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-income" />
                  {language === "id" ? "Akun Aktif" : "Active Accounts"}
                  <span className="text-muted-foreground/40 font-mono font-normal">({activeAccounts.length})</span>
                </h2>
                <span className="text-[10px] text-muted-foreground/40 font-mono hidden sm:inline">
                  {language === "id" ? "Tahan kartu untuk menyeret" : "Hold & drag card to reorder"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeAccounts.map((account, index) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    canMoveUp={index > 0}
                    canMoveDown={index < activeAccounts.length - 1}
                    isDragging={draggedId === account.id}
                    isDragOver={dragOverId === account.id}
                    dragOverPosition={dragOverId === account.id ? dragOverPosition : null}
                    isDraggingRef={isDraggingRef}
                    onDragStart={(e) => handleDragStart(account.id, e)}
                    onDragOver={(pos, e) => handleDragOver(account.id, pos, e)}
                    onDragLeave={() => handleDragLeave(account.id)}
                    onDrop={() => handleDrop(account.id)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(account.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMove={(dir) => handleQuickMove(account.id, dir)}
                    onEdit={() => setEditing(account)}
                    onDelete={() => setConfirmDelete(account)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactive Accounts Grid */}
          {inactiveAccounts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em] flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-white/[0.2]" />
                  {language === "id" ? "Nonaktif" : "Inactive"}
                  <span className="text-muted-foreground/40 font-mono font-normal">({inactiveAccounts.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inactiveAccounts.map((account, index) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    canMoveUp={index > 0}
                    canMoveDown={index < inactiveAccounts.length - 1}
                    isDragging={draggedId === account.id}
                    isDragOver={dragOverId === account.id}
                    dragOverPosition={dragOverId === account.id ? dragOverPosition : null}
                    isDraggingRef={isDraggingRef}
                    onDragStart={(e) => handleDragStart(account.id, e)}
                    onDragOver={(pos, e) => handleDragOver(account.id, pos, e)}
                    onDragLeave={() => handleDragLeave(account.id)}
                    onDrop={() => handleDrop(account.id)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(account.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMove={(dir) => handleQuickMove(account.id, dir)}
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
            color: "var(--accent)",
            icon: "",
            isActive: true,
          }}
          onSuccess={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <AccountForm
          open={editing !== null}
          onClose={() => setEditing(null)}
          mode="edit"
          initial={toFormInitial(editing)}
          onSuccess={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

const normalizeColor = (col: string | null | undefined) => {
  if (!col) return "var(--accent)";
  if (col === "#388BFD" || col === "#3B82F6") return "var(--accent)";
  return col;
};

// --- Account Card Component with Mouse & Touch Drag & Drop ------------------

function AccountCard({
  account,
  canMoveUp,
  canMoveDown,
  isDragging,
  isDragOver,
  dragOverPosition,
  isDraggingRef,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMove,
  onEdit,
  onDelete,
}: {
  account: AccountRowData;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dragOverPosition: "before" | "after" | null;
  isDraggingRef: React.MutableRefObject<boolean>;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (position: "before" | "after", e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onTouchStart: () => void;
  onTouchMove: (clientX: number, clientY: number) => void;
  onTouchEnd: () => void;
  onMove: (direction: "up" | "down") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { language } = useLanguage();
  const { refresh } = useApp();
  const [pending, startTransition] = useTransition();
  const [hovered, setHovered] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      await toggleAccountActive(account.id);
      refresh();
    });
  }

  const swatch = normalizeColor(account.color);
  const isNegative = account.balance < 0;
  const maskedNumber = `ACC-${account.id.slice(-4).toUpperCase()} // BLOCK-${account.id.slice(0, 4).toUpperCase()}`;

  const typeLabel: Record<AccountTypeInput, string> = {
    bank: language === "id" ? "Bank" : "Bank",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    cash: language === "id" ? "Tunai" : "Cash",
    investment: language === "id" ? "Investasi" : "Investment",
  };

  return (
    <div
      data-account-id={account.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const isBefore = e.clientX < rect.left + rect.width / 2;
        onDragOver(isBefore ? "before" : "after", e);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative group transition-all duration-200 select-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-35 scale-[0.97] ring-2 ring-accent/60 ring-dashed rounded-2xl",
        isDragOver && "scale-[1.02] z-30"
      )}
    >
      {/* Drop position insertion indicator lines */}
      {isDragOver && dragOverPosition === "before" && (
        <div className="absolute -left-2 top-2 bottom-2 w-1.5 bg-accent rounded-full shadow-[0_0_10px_var(--accent)] z-40 animate-pulse pointer-events-none" />
      )}
      {isDragOver && dragOverPosition === "after" && (
        <div className="absolute -right-2 top-2 bottom-2 w-1.5 bg-accent rounded-full shadow-[0_0_10px_var(--accent)] z-40 animate-pulse pointer-events-none" />
      )}

      {/* Physical Card Container */}
      <Link
        to={`/accounts/${account.id}`}
        draggable={false}
        onClick={(e) => {
          if (isDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={cn(
          "block relative z-10",
          !account.isActive && "opacity-40 grayscale"
        )}
      >
        <Card
          className={cn(
            "p-5 pb-14 min-h-[175px] select-none rounded-2xl border transition-all duration-300 gap-0 overflow-hidden bg-background backdrop-blur-md",
            isDragOver && "border-accent ring-2 ring-accent/30 shadow-xl"
          )}
          style={{
            borderColor: isDragOver
              ? "var(--accent)"
              : hovered
              ? `color-mix(in srgb, ${swatch} 45%, transparent)`
              : `color-mix(in srgb, ${swatch} 15%, var(--border))`,
            boxShadow: isDragOver
              ? "0 12px 28px -4px rgba(0, 0, 0, 0.45)"
              : hovered
              ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 10px 24px -4px rgba(0, 0, 0, 0.4)`
              : `inset 0 1px 0 0 rgba(255, 255, 255, 0.02), 0 4px 12px -2px rgba(0, 0, 0, 0.25)`,
            transform: hovered && !isDragging && !isDragOver ? "translateY(-4px)" : "none",
          }}
        >
          {/* Sci-fi Corner Brackets */}
          <div
            className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent/20 rounded-tl transition-all duration-300"
            style={{ borderColor: hovered || isDragOver ? swatch : undefined }}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent/20 rounded-tr transition-all duration-300"
            style={{ borderColor: hovered || isDragOver ? swatch : undefined }}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent/20 rounded-bl transition-all duration-300"
            style={{ borderColor: hovered || isDragOver ? swatch : undefined }}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent/20 rounded-br transition-all duration-300"
            style={{ borderColor: hovered || isDragOver ? swatch : undefined }}
          />

          {/* Card Header: Icon/Chip, Drag Handle & Status */}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              {/* Institution Icon or EMV Chip */}
              {account.icon && account.icon !== "none" ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] group-hover:scale-105">
                  <span className="text-xl">{account.icon}</span>
                </div>
              ) : (
                <div className="w-9 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 relative overflow-hidden flex flex-col p-1 shadow-[0_0_8px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all duration-300">
                  <div className="flex h-1/3 w-full justify-between">
                    <div className="w-2.5 h-full border-r border-b border-amber-500/20" />
                    <div className="w-2.5 h-full border-l border-b border-amber-500/20" />
                  </div>
                  <div className="flex h-1/3 w-full justify-between items-center px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                  </div>
                  <div className="flex h-1/3 w-full justify-between">
                    <div className="w-2.5 h-full border-r border-t border-amber-500/20" />
                    <div className="w-2.5 h-full border-l border-t border-amber-500/20" />
                  </div>
                  {/* Cyber active status point */}
                  <div className={cn(
                    "absolute right-1 top-1 w-1.5 h-1.5 rounded-full animate-pulse",
                    account.isActive ? "bg-income shadow-[0_0_4px_var(--income)]" : "bg-expense shadow-[0_0_4px_var(--expense)]"
                  )} />
                </div>
              )}

              {/* Dedicated Touch & Mouse Drag Handle Indicator */}
              <div
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onTouchStart();
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) {
                    e.preventDefault();
                    onTouchMove(touch.clientX, touch.clientY);
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  onTouchEnd();
                }}
                className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-accent hover:bg-white/[0.06] active:bg-accent/20 cursor-grab active:cursor-grabbing transition-colors touch-none"
                title={language === "id" ? "Seret untuk memindahkan kartu (Mouse / Sentuh)" : "Drag to reorder card (Mouse / Touch)"}
              >
                <GripVertical size={14} />
              </div>
            </div>
            
            {/* Account Type Badge */}
            <div className="flex flex-col items-end gap-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
                style={{
                  backgroundColor: `color-mix(in srgb, ${swatch} 15%, transparent)`,
                  color: swatch,
                  borderColor: `color-mix(in srgb, ${swatch} 30%, transparent)`
                }}
              >
                {typeLabel[account.type]}
              </span>
              {!account.isActive && (
                <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  {language === "id" ? "Nonaktif" : "Inactive"}
                </span>
              )}
            </div>
          </div>

          {/* Card Body: Balance & Card Number */}
          <div className="space-y-1 relative z-10 mb-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
              {language === "id" ? "Saldo Tersedia" : "Available Balance"}
            </p>
            <p className={cn(
              "text-2xl font-black font-mono tracking-tight tabular-nums transition-colors duration-300",
              isNegative ? "text-expense" : "text-income"
            )}>
              {formatIDR(account.balance)}
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.15em] pt-0.5 uppercase">
              {maskedNumber}
            </p>
          </div>

          {/* Card Footer: Holder Name & Transaction Count */}
          <div className="flex items-end justify-between border-t border-border/40 pt-3 relative z-10">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-bold mb-0.5">
                {language === "id" ? "Nama Akun" : "Account Name"}
              </p>
              <p className="text-xs font-bold text-foreground truncate tracking-wide transition-colors duration-300">
                {account.name}
              </p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-white/[0.02] border border-border/40">
              <svg className="w-2.5 h-2.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[9px] font-mono text-muted-foreground/60 font-bold tabular-nums">
                {account.transactionCount ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </Link>

      {/* Floating Action Dropdown Menu - Outside Link */}
      <div className="absolute bottom-3 left-4 right-4 z-30 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="text-[9px] text-muted-foreground/40 font-mono">
            ID: {account.id.slice(-6)}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={language === "id" ? "Aksi akun" : "Account actions"}
                className="h-7 w-7 hover:bg-white/[0.12] bg-white/[0.04] border border-white/[0.08] text-muted-foreground/60 hover:text-foreground hover:border-white/[0.15] shrink-0 transition-all duration-200 backdrop-blur-md shadow-lg flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                style={{ borderRadius: 'var(--dropdown-radius, 8px)' }}
                disabled={pending}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl p-1">
              {/* Quick Move Reorder Actions for Mobile / Accessibility */}
              {canMoveUp && (
                <DropdownMenuItem
                  onSelect={() => onMove("up")}
                  className="rounded-lg text-xs px-3 py-2 gap-2.5 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent active:scale-95"
                >
                  <ArrowUp size={13} className="transition-transform duration-200 group-hover:-translate-y-0.5 text-accent" />
                  <span className="font-medium">{language === "id" ? "Pindahkan ke Atas" : "Move Up"}</span>
                </DropdownMenuItem>
              )}
              {canMoveDown && (
                <DropdownMenuItem
                  onSelect={() => onMove("down")}
                  className="rounded-lg text-xs px-3 py-2 gap-2.5 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent active:scale-95"
                >
                  <ArrowDown size={13} className="transition-transform duration-200 group-hover:translate-y-0.5 text-accent" />
                  <span className="font-medium">{language === "id" ? "Pindahkan ke Bawah" : "Move Down"}</span>
                </DropdownMenuItem>
              )}
              {(canMoveUp || canMoveDown) && <DropdownMenuSeparator className="bg-white/[0.08] my-1" />}

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
  const { refresh } = useApp();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(target.id);
      if (result.ok) {
        onClose();
        refresh();
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
              <Card className="p-4 gap-0">
                <p className="text-sm font-semibold text-foreground">
                  {target.name}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono tabular-nums">
                  {formatIDR(target.balance)} · {target.transactionCount ?? 0} {language === "id" ? "transaksi" : "transactions"}
                </p>
              </Card>

              {(target.transactionCount ?? 0) > 0 && (
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
    balance: row.balance,
  };
}
