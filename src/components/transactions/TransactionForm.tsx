import { useActionState, useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  ScanLine,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { cn } from "@/lib/utils/cn";
import { formatInputRupiah, formatIDR, cleanMoneyString } from "@/lib/utils/formatters";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api, normalizeImageUrl } from "@/lib/api";

import {
  createTransaction,
  updateTransaction,
  createBulkTransactions,
} from "@/app/actions/transactions";
import type { ActionResult } from "@/types";
import type { TransactionTypeInput } from "@/lib/utils/validators";

// ✅ Import cache invalidation
import { invalidateCache } from "@/lib/cache";

// ✅ Shared & Extracted components
import { FormSelect } from "@/components/ui/FormSelect";
import { CustomSingleDatePicker } from "@/components/ui/CustomSingleDatePicker";
import { ReceiptScanner } from "./ReceiptScanner";
import { ReceiptAttachment } from "./ReceiptAttachment";
import type { AIScanCandidate } from "@/app/actions/ai";

const FORM_ID = "transaction-modal-form";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type AccountOption = { id: string; name: string; balance?: number };
export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

export type FormTransaction = {
  type: TransactionTypeInput;
  amount: string;
  adminFee: string;
  date: string;
  accountId: string;
  categoryId: string | null;
  transferToId: string | null;
  description: string;
  note: string;
  taxDeductible: boolean;
  receiptFile: File | null;
  receiptImage: string | null;
  receiptUrl: string | null;
};

export type TransactionFormInitial = {
  id?: string;
  type: TransactionTypeInput;
  accountId: string;
  categoryId: string | null;
  transferToId: string | null;
  amount: number;
  adminFee?: number;
  date: string; // YYYY-MM-DD
  description: string;
  note: string;
  receiptImageUrl?: string | null;
  taxDeductible?: boolean;
};

export type TransactionModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: TransactionFormInitial;
  accounts: AccountOption[];
  categories: CategoryOption[];
  aiScanEnabled?: boolean;
  onSuccess?: () => void;
};

export function TransactionForm({
  open,
  onClose,
  mode,
  initial,
  accounts,
  categories,
  aiScanEnabled = false,
  onSuccess,
}: TransactionModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";

  // Memoize `initial` so the reset effect only fires when the editing ID
  // actually changes or the modal opens — not on every parent re-render
  // (the parent passes a freshly-created object each render).
  const prevInitialRef = useRef(initial);
  const prevOpenRef = useRef(open);
  const stableInitial = useMemo(() => {
    // Update stored initial only when modal opens or id changes
    if (open && (!prevOpenRef.current || prevInitialRef.current.id !== initial.id)) {
      prevInitialRef.current = initial;
    }
    if (!open) {
      prevInitialRef.current = initial;
    }
    prevOpenRef.current = open;
    return prevInitialRef.current;
  }, [open, initial]);

  // ---- state field ----
  const createEmptyTransaction = (init?: typeof stableInitial): FormTransaction => ({
    type: init?.type ?? "expense",
    amount: init?.amount ? formatInputRupiah(String(init.amount)) : "",
    adminFee: init?.adminFee ? formatInputRupiah(String(init.adminFee)) : "",
    date: init?.date ?? getLocalDateString(),
    accountId: init?.accountId ?? accounts[0]?.id ?? "",
    categoryId: init?.categoryId ?? null,
    transferToId: init?.transferToId ?? null,
    description: init?.description ?? "",
    note: init?.note ?? "",
    taxDeductible: !!init?.taxDeductible,
    receiptFile: null,
    receiptImage: normalizeImageUrl(init?.receiptImageUrl) || null,
    receiptUrl: normalizeImageUrl(init?.receiptImageUrl) || null,
  });

  const [items, setItems] = useState<FormTransaction[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [tab, setTab] = useState<"manual" | "scan">("manual");
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const updateField = <K extends keyof FormTransaction>(
    idx: number,
    field: K,
    value: FormTransaction[K]
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  // ---- server action ----
  const boundAction = useMemo(
    () =>
      mode === "edit" && initial.id
        ? updateTransaction.bind(null, initial.id)
        : createTransaction,
    [mode, initial.id]
  );

  const [state, formAction, pending] = useActionState<
    ActionResult<null> | undefined,
    FormData
  >(boundAction, undefined);

  const hasShownRestoreToastRef = useRef(false);

  // Reset modal state when open changes
  useEffect(() => {
    if (!open) {
      hasShownRestoreToastRef.current = false;
      return;
    }

    // For create mode: try to restore a saved draft
    if (mode === "create") {
      try {
        const saved = localStorage.getItem("tx-form-draft");
        if (saved) {
          const parsed = JSON.parse(saved) as FormTransaction[];
          setItems(parsed);
          setActiveIndex(0);
          if (!hasShownRestoreToastRef.current) {
            hasShownRestoreToastRef.current = true;
            toast.info(isId ? "Draft sebelumnya dipulihkan" : "Previous draft restored", {
              action: {
                label: isId ? "Buang draft" : "Discard",
                onClick: () => {
                  localStorage.removeItem("tx-form-draft");
                  setItems([createEmptyTransaction(stableInitial)]);
                },
              },
              duration: 6000,
            });
          }
          setTab("manual");
          setScanning(false);
          setUploading(false);
          setSubmitting(false);
          setCustomError(null);
          return;
        }
      } catch {
        localStorage.removeItem("tx-form-draft");
      }
    }

    setItems([createEmptyTransaction(stableInitial)]);
    setActiveIndex(0);
    setTab("manual");
    setScanning(false);
    setUploading(false);
    setSubmitting(false);
    setCustomError(null);
  }, [open, stableInitial]);

  // Auto-save draft for create mode whenever items change
  useEffect(() => {
    if (!open || mode !== "create") return;
    const hasContent = items.some(
      (item) => item.amount || item.description || item.note,
    );
    if (hasContent) {
      try {
        localStorage.setItem("tx-form-draft", JSON.stringify(items));
      } catch {
        // ignore storage errors
      }
    }
  }, [items, open, mode]);

  // Handle success callback
  useEffect(() => {
    if (state?.ok) {
      invalidateCache.afterTransactionChange();
      localStorage.removeItem("tx-form-draft");
      toast.success(
        mode === "create"
          ? isId
            ? "Transaksi ditambahkan"
            : "Transaction added"
          : isId
            ? "Transaksi diperbarui"
            : "Transaction updated"
      );
      onSuccess?.();
      onClose();
    } else if (state && !state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state, mode, isId, onSuccess, onClose]);

  // Esc + lock scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const hasInsufficient = items.some((item) => {
    const selectedAcc = accounts.find((a) => a.id === item.accountId);
    const accBalance = selectedAcc?.balance ?? 0;
    const numAmount = parseFloat(cleanMoneyString(item.amount)) || 0;
    const numFee = item.type === "transfer" ? (parseFloat(cleanMoneyString(item.adminFee)) || 0) : 0;
    
    if (item.type === "expense" || item.type === "transfer") {
      return selectedAcc && (numAmount + numFee) > accBalance;
    } else if (item.type === "income") {
      return numFee > numAmount && selectedAcc && (numFee - numAmount) > accBalance;
    }
    return false;
  });

  const handleAddItem = () => {
    const lastItem = items[items.length - 1];
    const newForm: FormTransaction = {
      ...createEmptyTransaction(stableInitial),
      accountId: lastItem?.accountId ?? accounts[0]?.id ?? "",
      type: lastItem?.type ?? "expense",
    };

    setItems((prev) => [...prev, newForm]);
    setActiveIndex(items.length);
  };

  // Handle Scan AI complete
  const handleScanComplete = (c: AIScanCandidate, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === activeIndex
            ? {
                ...item,
                type: c.type,
                amount: typeof c.amount === "number" ? formatInputRupiah(String(c.amount)) : item.amount,
                date: c.date || item.date,
                description: c.description || item.description,
                note: c.note || item.note,
                accountId: c.accountId && accounts.some((a) => a.id === c.accountId) ? c.accountId : item.accountId,
                transferToId: c.transferToId || item.transferToId,
                categoryId: c.categoryId || item.categoryId,
                receiptFile: file,
                receiptImage: reader.result as string,
              }
            : item
        )
      );
    };
    reader.readAsDataURL(file);
    setTab("manual");
  };

  // Upload receipt
  const uploadReceipt = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const data = await api.post<{ url: string }>("/api/upload/receipt", formData);
      return data.url;
    } catch (error) {
      console.error("Failed to upload receipt:", error);
      toast.error(isId ? "Gagal mengunggah struk" : "Failed to upload receipt");
      return null;
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const todayStr = getLocalDateString();
    for (let i = 0; i < items.length; i++) {
      if (items[i].date > todayStr) {
        setCustomError(isId ? "Tanggal transaksi tidak boleh di masa depan" : "Transaction date cannot be in the future");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "edit") {
        // Single edit mode uses the formAction
        const formData = new FormData();
        const activeItem = items[0] || createEmptyTransaction(stableInitial);
        
        let finalUrl = activeItem.receiptUrl || "";
        if (activeItem.receiptFile) {
          const url = await uploadReceipt(activeItem.receiptFile);
          if (!url) {
            setSubmitting(false);
            return;
          }
          finalUrl = url;
        }

        formData.set("type", activeItem.type);
        formData.set("amount", activeItem.amount);
        formData.set("adminFee", activeItem.type === "transfer" ? activeItem.adminFee : "");
        formData.set("date", activeItem.date);
        formData.set("accountId", activeItem.accountId);
        formData.set("categoryId", activeItem.type === "transfer" ? "" : activeItem.categoryId ?? "");
        formData.set("transferToId", activeItem.type === "transfer" ? activeItem.transferToId ?? "" : "");
        formData.set("description", activeItem.description);
        formData.set("note", activeItem.note);
        formData.set("receiptImageUrl", finalUrl);
        formData.set("taxDeductible", String(activeItem.taxDeductible));

        formAction(formData);
      } else {
        // Bulk Create mode
        const payloads: any[] = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let finalUrl = item.receiptUrl || null;
          if (item.receiptFile) {
            const url = await uploadReceipt(item.receiptFile);
            if (!url) {
              setSubmitting(false);
              return;
            }
            finalUrl = url;
          }
          
          payloads.push({
            type: item.type,
            accountId: item.accountId,
            amount: parseFloat(cleanMoneyString(item.amount)) || 0,
            adminFee: item.type === "transfer" ? (parseFloat(cleanMoneyString(item.adminFee)) || 0) : 0,
            date: item.date,
            description: item.description || (isId ? "Dicatat manual" : "Recorded manually"),
            note: item.note || "",
            categoryId: item.type === "transfer" ? null : item.categoryId || null,
            transferToId: item.type === "transfer" ? item.transferToId || null : null,
            receiptImageUrl: finalUrl,
          });
        }

        const res = await createBulkTransactions(payloads);
        if (res.ok) {
          invalidateCache.afterTransactionChange();
          localStorage.removeItem("tx-form-draft");
          toast.success(isId ? `${items.length} transaksi berhasil ditambahkan` : `${items.length} transactions added successfully`);
          onSuccess?.();
          onClose();
        } else {
          setCustomError(res.error || (isId ? "Gagal menyimpan transaksi" : "Failed to save transactions"));
        }
      }
    } catch (err: any) {
      console.error(err);
      setCustomError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const typeOptions: {
    value: TransactionTypeInput;
    label: string;
    icon: typeof TrendingUp;
    activeClass: string;
  }[] = [
    {
      value: "expense" as TransactionTypeInput,
      label: isId ? "Pengeluaran" : "Expense",
      icon: TrendingDown,
      activeClass: "data-[state=on]:bg-expense/15 data-[state=on]:text-expense",
    },
    {
      value: "income" as TransactionTypeInput,
      label: isId ? "Pemasukan" : "Income",
      icon: TrendingUp,
      activeClass: "data-[state=on]:bg-income/15 data-[state=on]:text-income",
    },
    {
      value: "transfer" as TransactionTypeInput,
      label: "Transfer",
      icon: ArrowLeftRight,
      activeClass: "data-[state=on]:bg-accent/15 data-[state=on]:text-accent",
    },
  ];

  const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

  const renderFields = (item: FormTransaction, idx: number) => {
    const filteredCategories = categories.filter((c) =>
      item.type === "income" ? c.type === "income" : c.type === "expense"
    );

    const selectedAccount = accounts.find((a) => a.id === item.accountId);
    const selectedDestAccount = accounts.find((a) => a.id === item.transferToId);
    const accountBalance = selectedAccount?.balance ?? 0;

    const numAmount = parseFloat(cleanMoneyString(item.amount)) || 0;
    const numFee = item.type === "transfer" ? (parseFloat(cleanMoneyString(item.adminFee)) || 0) : 0;

    let isInsufficient = false;
    let totalDeducted = 0;

    if (item.type === "expense" || item.type === "transfer") {
      totalDeducted = numAmount + numFee;
      if (selectedAccount && totalDeducted > accountBalance) {
        isInsufficient = true;
      }
    } else if (item.type === "income") {
      if (numFee > numAmount) {
        totalDeducted = numFee - numAmount;
        if (selectedAccount && totalDeducted > accountBalance) {
          isInsufficient = true;
        }
      }
    }

    const fieldErrors = (state?.fieldErrors ?? {}) as Record<string, string[]>;

    return (
      <div className="space-y-[18px]">
        {/* Tipe */}
        <div className="space-y-2.5">
          <Label className={labelCls}>{isId ? "Tipe" : "Type"}</Label>
          <ToggleGroup
            type="single"
            value={item.type}
            onValueChange={(v) => v && updateField(idx, "type", v as TransactionTypeInput)}
            className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 h-11"
          >
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "rounded-lg text-xs font-bold transition-all duration-200 h-9 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 data-[state=on]:border data-[state=on]:font-extrabold",
                    opt.value === "expense" && "data-[state=on]:border-expense/20",
                    opt.value === "income" && "data-[state=on]:border-income/20",
                    opt.value === "transfer" && "data-[state=on]:border-accent/20",
                    opt.activeClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        {/* Jumlah + Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <Label className={labelCls}>{isId ? "Jumlah" : "Amount"}</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">Rp</span>
              <Input
                inputMode="numeric"
                value={item.amount}
                onChange={(e) => updateField(idx, "amount", formatInputRupiah(e.target.value))}
                placeholder="0"
                className="h-11 pl-10 font-mono font-semibold"
              />
            </div>
            {fieldErrors.amount?.[0] ? <ErrText msg={fieldErrors.amount[0]} /> : null}
          </div>
          <div className="space-y-2.5">
            <Label className={labelCls}>{isId ? "Tanggal" : "Date"}</Label>
            <CustomSingleDatePicker value={item.date} onChange={(v) => updateField(idx, "date", v)} />
            {fieldErrors.date?.[0] ? <ErrText msg={fieldErrors.date[0]} /> : null}
          </div>
          {item.type === "transfer" && (
            <div className="space-y-2.5 sm:col-span-2">
              <Label className={labelCls}>{isId ? "Biaya Admin (Opsional)" : "Admin Fee (Optional)"}</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">Rp</span>
                <Input
                  inputMode="numeric"
                  value={item.adminFee}
                  onChange={(e) => updateField(idx, "adminFee", formatInputRupiah(e.target.value))}
                  placeholder="0"
                  className="h-11 pl-10 font-mono font-semibold"
                />
              </div>
              {(() => {
                const numAmount = parseFloat(cleanMoneyString(item.amount)) || 0;
                const numFee = parseFloat(cleanMoneyString(item.adminFee)) || 0;
                if (numAmount > 0 && numFee > 0) {
                  const previewLabel = isId ? "Total dipotong dari pengirim: " : "Total deducted from sender: ";
                  const previewValue = numAmount + numFee;
                  return (
                    <p className="text-xs text-text-muted/80 font-medium">
                      {previewLabel}
                      <span className="font-semibold text-text-primary font-mono">{formatIDR(previewValue)}</span>
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}
          {isInsufficient && (
            <div className="sm:col-span-2">
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1.5 mt-1 animate-pulse">
                <span>⚠️</span>
                {isId
                  ? `Peringatan: Total pengeluaran (${formatIDR(totalDeducted)}) melebihi saldo akun (${formatIDR(accountBalance)})`
                  : `Warning: Total deduction (${formatIDR(totalDeducted)}) exceeds account balance (${formatIDR(accountBalance)})`}
              </p>
            </div>
          )}
        </div>

        {/* Akun + (Kategori / Transfer ke) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className={labelCls}>
                {item.type === "transfer"
                  ? isId
                    ? "Dari Akun"
                    : "From Account"
                  : isId
                    ? "Akun"
                    : "Account"}
              </Label>
              {selectedAccount && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-text-muted font-medium font-mono tabular-nums">
                  {isId ? "Saldo: " : "Bal: "}{formatIDR(accountBalance)}
                </span>
              )}
            </div>
            <FormSelect
              value={item.accountId}
              onChange={(v) => updateField(idx, "accountId", v)}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              placeholder={isId ? "Pilih akun" : "Select account"}
            />
            {fieldErrors.accountId?.[0] ? <ErrText msg={fieldErrors.accountId[0]} /> : null}
          </div>

          {item.type === "transfer" ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className={labelCls}>{isId ? "Ke Akun" : "To Account"}</Label>
                {selectedDestAccount && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-text-muted font-medium font-mono tabular-nums">
                    {isId ? "Saldo: " : "Bal: "}{formatIDR(selectedDestAccount.balance ?? 0)}
                  </span>
                )}
              </div>
              <FormSelect
                value={item.transferToId ?? ""}
                onChange={(v) => updateField(idx, "transferToId", v)}
                options={accounts
                  .filter((a) => a.id !== item.accountId)
                  .map((a) => ({ value: a.id, label: a.name }))}
                placeholder={isId ? "Pilih akun" : "Select account"}
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              <Label className={labelCls}>{isId ? "Kategori" : "Category"}</Label>
              <FormSelect
                value={item.categoryId ?? ""}
                onChange={(v) => updateField(idx, "categoryId", v)}
                options={filteredCategories.map((c) => ({
                  value: c.id,
                  label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
                }))}
                placeholder={isId ? "Pilih kategori" : "Select category"}
              />
            </div>
          )}
        </div>

        {/* Deskripsi */}
        <div className="space-y-2.5">
          <Label className={labelCls}>{isId ? "Deskripsi" : "Description"}</Label>
          <Input
            value={item.description}
            onChange={(e) => updateField(idx, "description", e.target.value)}
            placeholder={isId ? "mis. Makan siang" : "e.g. Lunch"}
            className="h-11"
          />
        </div>

        {/* Catatan */}
        <div className="space-y-2.5">
          <Label className={labelCls}>{isId ? "Catatan (opsional)" : "Note (optional)"}</Label>
          <Textarea
            value={item.note}
            onChange={(e) => updateField(idx, "note", e.target.value)}
            placeholder={isId ? "Tambahkan catatan…" : "Add a note…"}
            className="min-h-[70px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
          />
        </div>

        {/* Deduktibel Pajak */}
        {item.type !== "transfer" && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id={`taxDeductible-${idx}`}
              checked={item.taxDeductible}
              onChange={(e) => updateField(idx, "taxDeductible", e.target.checked)}
              className="h-4 w-4 rounded border-border bg-elevated text-accent focus:ring-accent"
            />
            <Label htmlFor={`taxDeductible-${idx}`} className="text-xs font-medium text-foreground cursor-pointer select-none">
              {isId ? "Deduktibel Pajak (Donasi, operasional, dll.)" : "Tax Deductible (Donations, operational, etc.)"}
            </Label>
          </div>
        )}

        {/* Lampiran Struk */}
        <ReceiptAttachment
          receiptFile={item.receiptFile}
          setReceiptFile={(file) => updateField(idx, "receiptFile", file)}
          receiptImage={item.receiptImage}
          setReceiptImage={(img) => updateField(idx, "receiptImage", img)}
          receiptUrl={item.receiptUrl}
          setReceiptUrl={(url) => updateField(idx, "receiptUrl", url)}
        />
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* ===== STICKY HEADER ===== */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {mode === "create"
                ? isId
                  ? "Tambah Transaksi"
                  : "Add Transaction"
                : isId
                  ? "Edit Transaksi"
                  : "Edit Transaction"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Catat pemasukan, pengeluaran, atau transfer."
                : "Record an income, expense, or transfer."}
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

        {/* ===== SCROLLABLE BODY ===== */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {items.length > 1 && (
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 mb-5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-text-muted">
                  {isId ? `Transaksi ${activeIndex + 1} dari ${items.length}` : `Transaction ${activeIndex + 1} of ${items.length}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  disabled={activeIndex === items.length - 1}
                  onClick={() => setActiveIndex((prev) => Math.min(items.length - 1, prev + 1))}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  const nextIdx = activeIndex === items.length - 1 ? activeIndex - 1 : activeIndex;
                  setItems((prev) => prev.filter((_, i) => i !== activeIndex));
                  setActiveIndex(Math.max(0, nextIdx));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {mode === "create" && aiScanEnabled ? (
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "manual" | "scan")}
              className="w-full"
            >
              <TabsList className="mb-5 grid w-full grid-cols-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 h-11">
                <TabsTrigger
                  value="manual"
                  className="rounded-lg text-xs font-bold transition-all duration-200 h-9 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/20 data-[state=active]:font-extrabold text-muted-foreground hover:text-foreground"
                >
                  Manual
                </TabsTrigger>
                <TabsTrigger
                  value="scan"
                  className="rounded-lg text-xs font-bold transition-all duration-200 h-9 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/20 data-[state=active]:font-extrabold text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  {isId ? "Scan AI" : "AI Scan"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-0 overflow-hidden">
                <div className="relative w-full">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: `translateX(-${(activeIndex * 100) / items.length}%)`, 
                      width: `${items.length * 100}%` 
                    }}
                  >
                    {items.map((item, idx) => (
                      <div key={idx} style={{ width: `${100 / items.length}%` }} className="px-1 shrink-0">
                        {renderFields(item, idx)}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scan" className="mt-0">
                <ReceiptScanner
                  scanning={scanning}
                  setScanning={setScanning}
                  onScanComplete={handleScanComplete}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="relative w-full overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ 
                  transform: `translateX(-${(activeIndex * 100) / items.length}%)`, 
                  width: `${items.length * 100}%` 
                }}
              >
                {items.map((item, idx) => (
                  <div key={idx} style={{ width: `${100 / items.length}%` }} className="px-1 shrink-0">
                    {renderFields(item, idx)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* form submit container */}
          <form id={FORM_ID} onSubmit={handleSubmit} className="hidden" />

          {(state && !state.ok && state.error) || customError ? (
            <div className="mt-4">
              <ErrText msg={customError || state?.error || ""} />
            </div>
          ) : null}
        </div>

        {/* ===== STICKY FOOTER ===== */}
        <div className="flex items-center justify-between border-t border-border px-7 py-5">
          <div className="flex items-center gap-2">
            {mode === "create" && (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-1.5 text-[13px] border-accent/20 text-accent hover:bg-accent/5 hover:text-accent font-bold"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
                {isId ? "Tambah Form" : "Add Form"}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 text-[13px]"
              disabled={pending || submitting}
            >
              {isId ? "Batal" : "Cancel"}
            </Button>
             <Button
              type="submit"
              form={FORM_ID}
              className="h-10 gap-1.5 text-[13px]"
              disabled={pending || scanning || uploading || hasInsufficient || submitting}
            >
              {pending || uploading || submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {mode === "create"
                ? isId
                  ? "Simpan Semua"
                  : "Save All"
                : isId
                  ? "Perbarui"
                  : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ErrText({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
      {msg}
    </p>
  );
}