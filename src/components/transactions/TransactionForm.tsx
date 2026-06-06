"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Camera, Loader2, Sparkles, WandSparkles, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  createTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import { scanTransactionText } from "@/app/actions/ai";
import type { ActionResult } from "@/types";
import { formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import type { TransactionTypeInput } from "@/lib/utils/validators";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const LAST_USED_STORAGE_KEY = "maybe_finance_last_used_categories";

type LastUsedMap = Partial<Record<"income" | "expense", string>>;

function readLastUsed(): LastUsedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LAST_USED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastUsedMap) : {};
  } catch {
    return {};
  }
}

function writeLastUsed(type: "income" | "expense", categoryId: string) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readLastUsed(), [type]: categoryId };
    localStorage.setItem(LAST_USED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage disabled — silently ignore.
  }
}

/**
 * Shared transaction form — used by Add and Edit modals.
 *
 * Saat `aiScanEnabled=true` dan mode=create, header form berubah jadi
 * dua tab: "Manual" (default) dan "Scan AI" untuk parse teks struk
 * lewat DeepSeek. Hasil scan auto-fill state field, user tetap
 * memvalidasi dan klik "Tambah transaksi" sendiri.
 *
 * Type segmented control toggles which fields are shown:
 *  - income / expense: category dropdown
 *  - transfer: destination account dropdown (no category)
 */
export interface AccountOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
}

export interface TransactionFormInitial {
  id?: string;
  type: TransactionTypeInput;
  accountId: string;
  categoryId: string | null;
  transferToId: string | null;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  note: string;
}

interface Props {
  mode: "create" | "edit";
  initial: TransactionFormInitial;
  accounts: AccountOption[];
  categories: CategoryOption[];
  /** True kalau DEEPSEEK_API_KEY ter-set di server. Hanya relevan untuk create. */
  aiScanEnabled?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  mode,
  initial,
  accounts,
  categories,
  aiScanEnabled = false,
  onSuccess,
  onCancel,
}: Props) {
  const [type, setType] = useState<TransactionTypeInput>(initial.type);
  const [accountId, setAccountId] = useState(initial.accountId);
  const [categoryId, setCategoryId] = useState<string>(initial.categoryId ?? "");
  const [transferToId, setTransferToId] = useState<string>(initial.transferToId ?? "");
  const [amount, setAmount] = useState<string>(
    initial.amount > 0 ? formatInputRupiah(String(initial.amount)) : "",
  );
  const [date, setDate] = useState<string>(initial.date);
  const [description, setDescription] = useState<string>(initial.description);
  const [note, setNote] = useState<string>(initial.note);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

  // Smart default: pre-fill the category for create-mode by reading the
  // last-used category for the current type from localStorage. Also
  // clears stale categoryId when toggling between expense/income so the
  // Select doesn't keep an id from the wrong type.
  useEffect(() => {
    if (mode !== "create") return;
    if (type === "transfer") return;

    const matchesType = categories.some(
      (c) => c.id === categoryId && c.type === type,
    );
    if (categoryId && !matchesType) {
      setCategoryId("");
    }

    if (categoryId && matchesType) return;
    const last = readLastUsed()[type];
    if (last && categories.some((c) => c.id === last && c.type === type)) {
      setCategoryId(last);
    }
    // We intentionally rerun whenever `type` changes so switching the
    // segmented control surfaces the right pre-fill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, mode]);

  const action =
    mode === "edit" && initial.id
      ? updateTransaction.bind(null, initial.id)
      : createTransaction;

  const [state, formAction, pending] = useActionState<
    ActionResult<null> | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok) {
      // Persist the last-used category so the next create-mode form
      // pre-fills it automatically.
      if (type !== "transfer" && categoryId) {
        writeLastUsed(type, categoryId);
      }
      onSuccess();
    }
    return result;
  }, undefined);

  const filteredCategories = categories.filter((c) => c.type === type);

  /**
   * Apply AI scan candidate to the form state. Only fills slots that
   * the AI is confident about — empty/null answers leave existing
   * values alone so user input is never silently overwritten.
   */
  function applyAICandidate(candidate: {
    type: TransactionTypeInput;
    amount: number;
    date: string | null;
    description: string | null;
    accountId: string | null;
    transferToId: string | null;
    categoryId: string | null;
  }) {
    setType(candidate.type);
    setAmount(String(candidate.amount));
    if (candidate.date) setDate(candidate.date);
    if (candidate.description) setDescription(candidate.description);
    if (candidate.accountId) setAccountId(candidate.accountId);
    setTransferToId(candidate.transferToId ?? "");
    setCategoryId(candidate.categoryId ?? "");
    setActiveTab("manual");
  }

  const showTabs = mode === "create";

  const formContent = (
    <form action={formAction} className="space-y-4" noValidate>
      {/* Type segmented control */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Tipe Transaksi</Label>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(v) => v && setType(v as TransactionTypeInput)}
          className="grid grid-cols-3 w-full bg-white/[0.01] border border-white/[0.06] rounded-xl p-1 gap-1"
          aria-label="Tipe transaksi"
        >
          <ToggleGroupItem 
            value="expense"
            className={cn(
              "rounded-lg py-2.5 text-xs font-bold transition-all duration-300 outline-none flex items-center justify-center gap-1.5",
              "data-[state=on]:bg-expense/10 data-[state=on]:text-expense data-[state=on]:border-expense/20"
            )}
          >
            <TrendingDown size={14} />
            <span>Pengeluaran</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="income"
            className={cn(
              "rounded-lg py-2.5 text-xs font-bold transition-all duration-300 outline-none flex items-center justify-center gap-1.5",
              "data-[state=on]:bg-income/10 data-[state=on]:text-income data-[state=on]:border-income/20"
            )}
          >
            <TrendingUp size={14} />
            <span>Pemasukan</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="transfer"
            className={cn(
              "rounded-lg py-2.5 text-xs font-bold transition-all duration-300 outline-none flex items-center justify-center gap-1.5",
              "data-[state=on]:bg-accent/10 data-[state=on]:text-accent data-[state=on]:border-accent/20"
            )}
          >
            <ArrowLeftRight size={14} />
            <span>Transfer</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Jumlah */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Jumlah</Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/45 select-none transition-colors duration-300 group-focus-within:text-foreground">
              Rp
            </span>
            <Input
              id="amount"
              name="amount"
              type="text"
              inputMode="numeric"
              required
              value={amount}
              onChange={(e) => setAmount(formatInputRupiah(e.target.value))}
              className="pl-10 font-mono font-semibold"
              aria-invalid={!!state?.fieldErrors?.amount}
            />
          </div>
          {state?.fieldErrors?.amount?.[0] ? (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {state.fieldErrors.amount[0]}
            </p>
          ) : null}
        </div>

        {/* Tanggal */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Tanggal</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!state?.fieldErrors?.date}
          />
          {state?.fieldErrors?.date?.[0] ? (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {state.fieldErrors.date[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Akun */}
        <div className="space-y-2">
          <Label htmlFor="accountId" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
            {type === "transfer" ? "Dari akun" : "Akun"}
          </Label>
          <Select value={accountId} onValueChange={setAccountId} name="accountId" required>
            <SelectTrigger id="accountId" aria-invalid={!!state?.fieldErrors?.accountId}>
              <SelectValue placeholder="Pilih akun" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.accountId?.[0] ? (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {state.fieldErrors.accountId[0]}
            </p>
          ) : null}
        </div>

        {/* Dynamic field: Kategori or Ke akun */}
        {type === "transfer" ? (
          <div className="space-y-2">
            <Label htmlFor="transferToId" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Ke akun</Label>
            <Select
              value={transferToId}
              onValueChange={setTransferToId}
              name="transferToId"
              required
            >
              <SelectTrigger id="transferToId" aria-invalid={!!state?.fieldErrors?.transferToId}>
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.transferToId?.[0] ? (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {state.fieldErrors.transferToId[0]}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Kategori</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              name="categoryId"
              required
            >
              <SelectTrigger id="categoryId" aria-invalid={!!state?.fieldErrors?.categoryId}>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.categoryId?.[0] ? (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {state.fieldErrors.categoryId[0]}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Deskripsi */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Deskripsi</Label>
        <Input
          id="description"
          name="description"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mis. Kopi pagi"
        />
      </div>

      {/* Catatan */}
      <div className="space-y-2">
        <Label htmlFor="note" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">Catatan (opsional)</Label>
        <Textarea
          id="note"
          name="note"
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 ease-out min-h-[70px]"
        />
      </div>

      {state?.error ? (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          {state.error}
        </p>
      ) : null}

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-white/[0.04] mt-2">
        <Button type="submit" disabled={pending} className="flex-1 h-10 text-[13px] font-bold">
          {pending && <Loader2 size={14} className="animate-spin mr-1.5" />}
          {mode === "edit" ? "Simpan Perubahan" : "Tambah Transaksi"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={pending}
          className="h-10 text-[13px] px-5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
        >
          Batal
        </Button>
      </div>
    </form>
  );

  if (!showTabs) return formContent;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "manual" | "ai")}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles size={12} />
          Scan AI
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">{formContent}</TabsContent>

      <TabsContent value="ai">
        <AIScanPanel
          enabled={aiScanEnabled}
          onApply={applyAICandidate}
          accounts={accounts}
          categories={categories}
        />
      </TabsContent>
    </Tabs>
  );
}

// --- AI Scan Panel -------------------------------------------------------

interface AIPanelProps {
  enabled: boolean;
  onApply: (candidate: {
    type: TransactionTypeInput;
    amount: number;
    date: string | null;
    description: string | null;
    accountId: string | null;
    transferToId: string | null;
    categoryId: string | null;
  }) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

// --- Helper to load Tesseract.js dynamically ----------------------------

function loadTesseract(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js";
    script.onload = () => {
      resolve((window as any).Tesseract);
    };
    script.onerror = () => {
      reject(
        new Error("Gagal memuat library OCR. Silakan periksa koneksi internet Anda.")
      );
    };
    document.body.appendChild(script);
  });
}

function AIScanPanel({ enabled, onApply, accounts, categories }: AIPanelProps) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [preview, setPreview] = useState<null | {
    type: TransactionTypeInput;
    amount: number;
    date: string | null;
    description: string | null;
    accountId: string | null;
    transferToId: string | null;
    categoryId: string | null;
    confidence: number;
    reasoning: string | null;
  }>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrPending(true);
    setOcrProgress("Memuat library OCR...");

    try {
      const Tesseract = await loadTesseract();
      setOcrProgress("Membaca teks dari struk...");

      const result = await Tesseract.recognize(file, "ind+eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(`Mengekstrak teks (${Math.round(m.progress * 100)}%)`);
          }
        },
      });

      const extractedText = result.data.text;
      if (!extractedText.trim()) {
        toast.error("Tidak ada teks yang terdeteksi dari gambar tersebut.");
      } else {
        setText(extractedText);
        toast.success("Teks berhasil diekstrak! Silakan klik 'Scan dengan AI' di bawah.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal melakukan OCR pada gambar.");
    } finally {
      setOcrPending(false);
      setOcrProgress("");
      e.target.value = "";
    }
  }

  function handleScan() {
    if (!text.trim()) {
      toast.error("Tempel atau ekstrak teks transaksi terlebih dahulu.");
      return;
    }
    startTransition(async () => {
      const result = await scanTransactionText(text);
      if (!result.ok) {
        toast.error((result as any).error || "Gagal memproses AI scan.");
        return;
      }
      setPreview(result.candidate);
    });
  }

  function handleApply() {
    if (!preview) return;
    onApply(preview);
    toast.success("Form berhasil diisi dari hasil scan AI.");
    setPreview(null);
    setText("");
  }

  if (!enabled) {
    return (
      <div className="rounded-md border border-dashed border-border bg-elevated p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <p className="text-sm font-medium text-foreground">
            Scan AI belum aktif
          </p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Untuk mengaktifkan, tambahkan kunci API DeepSeek ke file{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-foreground font-mono">
            .env
          </code>
          :
        </p>
        <pre className="bg-card border border-border rounded p-2 text-[11px] font-mono text-foreground overflow-x-auto">
          DEEPSEEK_API_KEY=&quot;sk-xxxxxxxxxxxxxxxx&quot;
        </pre>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dapatkan kunci di{" "}
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            platform.deepseek.com/api_keys
          </a>
          , lalu restart dev server agar variabel terbaca.
        </p>
      </div>
    );
  }

  const accountName = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? null;
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? null;

  return (
    <div className="space-y-4">
      {/* Photo OCR Upload Zone */}
      <div className="border border-dashed border-border rounded-lg p-4 bg-elevated/30 flex flex-col items-center justify-center text-center space-y-2 hover:bg-elevated/50 transition-colors relative overflow-hidden group">
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          onChange={handleImageUpload}
          disabled={ocrPending}
        />
        {ocrPending ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-xs font-medium text-foreground">
              {ocrProgress}
            </p>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Camera size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Unggah Foto Struk / Bukti Transaksi</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Klik atau seret file gambar ke sini untuk mengekstrak teks otomatis</p>
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ai-text">Teks Transaksi</Label>
        <Textarea
          id="ai-text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={[
            "Atau edit teks hasil scan di sini:",
            "BCA m-BCA 23/05 Tarik Tunai Rp250.000 di ATM Kuningan",
            "atau:",
            "Bayar Gojek GoFood Rp 87.500 - Burger King",
          ].join("\n")}
        />
        <p className="text-xs text-muted-foreground">
          Anda juga dapat langsung menempel SMS bank, notifikasi e-wallet, atau ringkasan struk secara manual.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleScan}
        disabled={pending || text.trim().length < 10}
        className="w-full"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <WandSparkles size={14} />
        )}
        {pending ? "Memproses…" : "Scan dengan AI"}
      </Button>

      {preview ? (
        <div className="rounded-md border border-border bg-elevated p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" />
              Hasil deteksi AI
            </span>
            <Badge
              variant={preview.confidence >= 0.7 ? "income" : "outline"}
              className="font-mono"
            >
              {Math.round(preview.confidence * 100)}% yakin
            </Badge>
          </div>

          <dl className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
            <PreviewRow label="Tipe" value={typeLabel(preview.type)} />
            <PreviewRow
              label="Jumlah"
              value={
                <span className="font-mono tabular-nums">
                  {formatIDR(preview.amount)}
                </span>
              }
            />
            <PreviewRow
              label="Tanggal"
              value={
                preview.date ? (
                  <span className="font-mono">{preview.date}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <PreviewRow
              label={preview.type === "transfer" ? "Dari" : "Akun"}
              value={
                accountName(preview.accountId) ?? (
                  <span className="text-muted-foreground">Tidak terdeteksi</span>
                )
              }
            />
            {preview.type === "transfer" ? (
              <PreviewRow
                label="Ke"
                value={
                  accountName(preview.transferToId) ?? (
                    <span className="text-muted-foreground">Tidak terdeteksi</span>
                  )
                }
              />
            ) : (
              <PreviewRow
                label="Kategori"
                value={
                  categoryName(preview.categoryId) ?? (
                    <span className="text-muted-foreground">Tidak terdeteksi</span>
                  )
                }
              />
            )}
            <PreviewRow
              label="Deskripsi"
              value={
                preview.description ?? (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
          </dl>

          {preview.reasoning ? (
            <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
              <span className="font-medium">AI:</span> {preview.reasoning}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              Pakai hasil ini
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreview(null)}
            >
              Buang
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground truncate">{value}</dd>
    </>
  );
}

function typeLabel(t: TransactionTypeInput): string {
  if (t === "income") return "Pemasukan";
  if (t === "expense") return "Pengeluaran";
  return "Transfer";
}
