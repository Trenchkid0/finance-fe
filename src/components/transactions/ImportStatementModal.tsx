import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Loader2, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Trash2, 
  Plus, 
  Sparkles, 
  X,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/FormSelect";
import { CustomSingleDatePicker } from "@/components/ui/CustomSingleDatePicker";
import { formatInputRupiah, cleanMoneyString } from "@/lib/utils/formatters";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { createBulkTransactions } from "@/app/actions/transactions";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export type AccountOption = { id: string; name: string; balance?: number };
export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

interface ImportStatementModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onSuccess: () => void;
}

type FormCandidate = {
  type: "income" | "expense" | "transfer";
  amount: string;
  date: string;
  accountId: string;
  categoryId: string | null;
  transferToId: string | null;
  description: string;
  note: string;
};

export function ImportStatementModal({
  open,
  onClose,
  accountId,
  accounts,
  categories,
  onSuccess,
}: ImportStatementModalProps) {
  const { language } = useLanguage();
  const isId = language === "id";

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parsed candidates ready for review
  const [candidates, setCandidates] = useState<FormCandidate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [checkingAi, setCheckingAi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPassword("");
    setIsParsing(false);
    setPasswordRequired(false);
    setPasswordError(null);
    setError(null);
    setCandidates([]);
    setIsSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    
    const checkAiStatus = async () => {
      setCheckingAi(true);
      try {
        const res = await api.get<{ enabled: boolean }>("/api/ai/status");
        setAiEnabled(!!res.enabled);
      } catch (err) {
        console.error("Failed to fetch AI status:", err);
        setAiEnabled(false);
      } finally {
        setCheckingAi(false);
      }
    };

    checkAiStatus();
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPasswordRequired(false);
    setPassword("");
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const name = selectedFile.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".csv") && !name.endsWith(".txt")) {
        setError(isId ? "Hanya file PDF, CSV, atau TXT yang diperbolehkan" : "Only PDF, CSV, or TXT files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordRequired(false);
    setPassword("");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      const name = selectedFile.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".csv") && !name.endsWith(".txt")) {
        setError(isId ? "Hanya file PDF, CSV, atau TXT yang diperbolehkan" : "Only PDF, CSV, or TXT files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseFile = async (providedPassword = "") => {
    if (!file) {
      setError(isId ? "Pilih file terlebih dahulu" : "Please select a file first");
      return;
    }

    setError(null);
    setPasswordError(null);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);
      if (providedPassword) {
        formData.append("password", providedPassword);
      }

      const res = await api.post<{
        ok: boolean;
        code: string;
        error: string;
        candidates?: Array<{
          type: "income" | "expense" | "transfer";
          amount: number;
          date: string | null;
          description: string | null;
          note: string | null;
          accountId: string | null;
          transferToId: string | null;
          categoryId: string | null;
        }>;
      }>("/api/transactions/import-file", formData);

      if (!res.ok) {
        if (res.code === "password_required") {
          setPasswordRequired(true);
        } else if (res.code === "invalid_password") {
          setPasswordRequired(true);
          setPasswordError(isId ? "Kata sandi salah. Silakan coba lagi." : "Incorrect password. Please try again.");
        } else {
          setError(res.error || (isId ? "Gagal mengurai file" : "Failed to parse file"));
        }
      } else {
        // Success
        setPasswordRequired(false);
        const mapped = (res.candidates || []).map((cand) => ({
          type: cand.type || "expense",
          amount: cand.amount ? formatInputRupiah(String(cand.amount)) : "",
          date: cand.date || new Date().toISOString().slice(0, 10),
          accountId: cand.accountId || accountId || accounts[0]?.id || "",
          categoryId: cand.categoryId || null,
          transferToId: cand.transferToId || null,
          description: cand.description || "",
          note: cand.note || "",
        }));
        setCandidates(mapped);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isId ? "Terjadi kesalahan koneksi" : "A connection error occurred"));
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError(isId ? "Masukkan kata sandi" : "Please enter the password");
      return;
    }
    parseFile(password);
  };

  // Update fields on a candidate
  const updateCandidateField = <K extends keyof FormCandidate>(
    idx: number,
    field: K,
    value: FormCandidate[K]
  ) => {
    setCandidates((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleAddCandidate = () => {
    const lastItem = candidates[candidates.length - 1];
    setCandidates((prev) => [
      ...prev,
      {
        type: lastItem?.type || "expense",
        amount: "",
        date: lastItem?.date || new Date().toISOString().slice(0, 10),
        accountId: lastItem?.accountId || accountId || accounts[0]?.id || "",
        categoryId: null,
        transferToId: null,
        description: "",
        note: "",
      },
    ]);
  };

  const handleDeleteCandidate = (idx: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    if (candidates.length === 0) return;
    setIsSaving(true);

    try {
      const payloads = candidates.map((item) => ({
        type: item.type,
        accountId: item.accountId,
        amount: parseFloat(cleanMoneyString(item.amount)) || 0,
        adminFee: 0,
        date: item.date,
        description: item.description || (isId ? "Hasil impor laporan" : "Statement import result"),
        note: item.note || "",
        categoryId: item.type === "transfer" ? null : item.categoryId || null,
        transferToId: item.type === "transfer" ? item.transferToId || null : null,
      }));

      const res = await createBulkTransactions(payloads);
      if (res.ok) {
        toast.success(isId ? `${candidates.length} transaksi berhasil disimpan` : `${candidates.length} transactions saved successfully`);
        onSuccess();
        onClose();
      } else {
        setError(res.error || (isId ? "Gagal menyimpan transaksi" : "Failed to save transactions"));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isId ? "Gagal menyimpan" : "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isParsing && !isSaving) onClose();
      }}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-48px)] w-full flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl animate-fade-in transition-all duration-300",
          candidates.length > 0 ? "max-w-[600px]" : "max-w-[520px]"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
            {candidates.length > 0 ? <Sparkles size={18} /> : <Upload size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {candidates.length > 0 
                ? (isId ? "Tinjau Transaksi Laporan" : "Review Statement Transactions")
                : (isId ? "Impor Transaksi (PDF / CSV)" : "Import Transactions (PDF / CSV)")}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {candidates.length > 0
                ? (isId ? `Tinjau dan ubah hasil pembacaan berkas (${candidates.length} transaksi ditemukan).` : `Review and modify parsed statement details (${candidates.length} transactions found).`)
                : (isId ? "Unggah rekening koran/mutasi PDF atau file CSV acak untuk dianalisis oleh AI." : "Upload e-statement PDFs or unstructured CSV files to analyze via AI.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isParsing || isSaving}
            className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label={isId ? "Tutup" : "Close"}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Modal Body */}
        {candidates.length > 0 ? (
          // REVIEW SCREEN (Full editor view)
          <>
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
              {error && (
                <div className="p-3.5 bg-expense/10 border border-expense/20 rounded-xl flex gap-2 text-xs text-expense">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {candidates.map((item, idx) => {
                  const filteredCategories = categories.filter((c) =>
                    item.type === "income" ? c.type === "income" : c.type === "expense"
                  );

                  return (
                    <Card 
                      key={idx} 
                      className="p-5 border-border bg-elevated/40 relative overflow-visible hover:border-white/[0.06] transition-colors gap-0"
                    >
                      {/* Card Header (Delete Button / Index) */}
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-4.5">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-muted-foreground/60 uppercase">
                          {isId ? `Transaksi #${idx + 1}` : `Transaction #${idx + 1}`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCandidate(idx)}
                          className="h-7 w-7 text-expense/80 hover:bg-expense/10 hover:text-expense rounded-lg"
                        >
                          <Trash2 size={13.5} />
                        </Button>
                      </div>

                      {/* Editing Fields */}
                      <div className="space-y-[18px]">
                        {/* Row 1: Type */}
                        <div className="space-y-2.5">
                          <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Tipe" : "Type"}</Label>
                          <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-border rounded-xl p-1 h-11">
                            {(["expense", "income", "transfer"] as const).map((t) => {
                              const active = item.type === t;
                              const label = t === "expense" ? (isId ? "Pengeluaran" : "Expense") : t === "income" ? (isId ? "Pemasukan" : "Income") : "Transfer";
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => updateCandidateField(idx, "type", t)}
                                  className={cn(
                                    "rounded-lg text-xs font-bold transition-all duration-200 h-9 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 border border-transparent",
                                    active && t === "expense" && "bg-expense/15 text-expense border-expense/20 font-extrabold",
                                    active && t === "income" && "bg-income/15 text-income border-income/20 font-extrabold",
                                    active && t === "transfer" && "bg-accent/15 text-accent border-accent/20 font-extrabold",
                                    !active && "hover:bg-white/[0.02]"
                                  )}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Row 2: Amount & Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Amount */}
                          <div className="space-y-2.5">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Jumlah" : "Amount"}</Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70 font-mono">Rp</span>
                              <Input
                                value={item.amount}
                                onChange={(e) => updateCandidateField(idx, "amount", formatInputRupiah(e.target.value))}
                                className="h-11 pl-10 font-mono font-semibold"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Date */}
                          <div className="space-y-2.5">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Tanggal" : "Date"}</Label>
                            <CustomSingleDatePicker value={item.date} onChange={(v) => updateCandidateField(idx, "date", v)} />
                          </div>
                        </div>

                        {/* Row 3: Account & Category/Transfer To */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Account */}
                          <div className="space-y-2.5">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Akun" : "Account"}</Label>
                            <FormSelect
                              value={item.accountId}
                              onChange={(v) => updateCandidateField(idx, "accountId", v)}
                              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                              placeholder={isId ? "Pilih akun" : "Select account"}
                            />
                          </div>

                          {/* Category / Transfer To */}
                          {item.type === "transfer" ? (
                            <div className="space-y-2.5">
                              <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Ke Akun" : "To Account"}</Label>
                              <FormSelect
                                value={item.transferToId ?? ""}
                                onChange={(v) => updateCandidateField(idx, "transferToId", v)}
                                options={accounts
                                  .filter((a) => a.id !== item.accountId)
                                  .map((a) => ({ value: a.id, label: a.name }))}
                                placeholder={isId ? "Pilih akun tujuan" : "Select destination"}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Kategori" : "Category"}</Label>
                              <FormSelect
                                value={item.categoryId ?? ""}
                                onChange={(v) => updateCandidateField(idx, "categoryId", v)}
                                options={filteredCategories.map((c) => ({
                                  value: c.id,
                                  label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
                                }))}
                                placeholder={isId ? "Pilih kategori" : "Select category"}
                              />
                            </div>
                          )}
                        </div>

                        {/* Row 4: Description */}
                        <div className="space-y-2.5">
                          <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Deskripsi" : "Description"}</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateCandidateField(idx, "description", e.target.value)}
                            className="h-11"
                            placeholder={isId ? "Deskripsi transaksi" : "Transaction description"}
                          />
                        </div>

                        {/* Row 5: Note */}
                        <div className="space-y-2.5">
                          <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{isId ? "Catatan (opsional)" : "Note (optional)"}</Label>
                          <Textarea
                            value={item.note}
                            onChange={(e) => updateCandidateField(idx, "note", e.target.value)}
                            className="min-h-[70px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                            placeholder={isId ? "Tambahkan catatan…" : "Add a note…"}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Add Candidate Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCandidate}
                className="w-full border-dashed border-border hover:border-accent/50 hover:bg-white/[0.02] h-10 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Plus size={14} />
                {isId ? "Tambah Transaksi Lain" : "Add Another Transaction"}
              </Button>
            </div>

            {/* Sticky Footer for Review screen */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-7 py-4">
              <span className="text-[11px] font-semibold text-muted-foreground/80 font-mono tabular-nums">
                {isId 
                  ? `Total: ${candidates.length} transaksi` 
                  : `Total: ${candidates.length} transactions`}
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCandidates([])}
                  disabled={isSaving}
                  className="h-10 px-5 rounded-xl text-xs font-semibold"
                >
                  {isId ? "Kembali" : "Back"}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving || candidates.length === 0}
                  className="h-10 px-5 rounded-xl text-xs font-semibold gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      {isId ? "Menyimpan..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      {isId ? "Simpan Transaksi" : "Save Transactions"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // UPLOAD / PASSWORD SCREEN
          <>
            <div className="flex-1 px-7 py-6 space-y-4">
              {/* If AI is disabled/not configured, show proactive alert */}
              {!aiEnabled && !checkingAi && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-xs text-amber-500">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">
                      {isId ? "Scan AI Belum Aktif" : "AI Scan Not Configured"}
                    </p>
                    <p className="leading-relaxed">
                      {isId
                        ? "Fitur pemindaian laporan ini membutuhkan kunci API DeepSeek. Harap tambahkan `DEEPSEEK_API_KEY` pada file `.env` di server Anda untuk mengaktifkan fitur ini."
                        : "This statement scanning feature requires a DeepSeek API key. Please add `DEEPSEEK_API_KEY` to your server's `.env` file to enable it."}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-expense/10 border border-expense/20 rounded-xl flex gap-2.5 text-xs text-expense">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div className="break-all">{error}</div>
                </div>
              )}

              {passwordRequired ? (
                // Password protection input
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-xs text-amber-500">
                    <Lock size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">{isId ? "File Terenkripsi" : "Encrypted File"}</p>
                      <p className="leading-relaxed">
                        {isId 
                          ? "Laporan PDF ini diproteksi oleh kata sandi. Masukkan kata sandi mutasi/rekening koran Anda untuk melanjutkannya." 
                          : "This PDF statement is password-protected. Please enter the password to unlock and scan it."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf-password">{isId ? "Kata Sandi File" : "File Password"}</Label>
                    <Input
                      id="pdf-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-sm font-sans"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="text-[11px] text-expense font-semibold mt-1 flex items-center gap-1">
                        <span>⚠️</span> {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setPasswordRequired(false)}
                      disabled={isParsing}
                      className="h-10 px-5 rounded-xl text-xs font-semibold"
                    >
                      {isId ? "Batal" : "Cancel"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isParsing || !password.trim()}
                      className="h-10 px-5 rounded-xl text-xs font-semibold gap-1.5"
                    >
                      {isParsing ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          {isId ? "Membuka..." : "Unlocking..."}
                        </>
                      ) : (
                        isId ? "Buka & Analisis" : "Unlock & Scan"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                // Drag & drop area
                <div className="space-y-4">
                  <div
                    onDragOver={!aiEnabled || checkingAi ? undefined : handleDragOver}
                    onDrop={!aiEnabled || checkingAi ? undefined : handleDrop}
                    onClick={() => {
                      if (aiEnabled && !checkingAi) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-2",
                      (!aiEnabled || checkingAi)
                        ? "border-border/40 bg-white/[0.002] cursor-not-allowed opacity-60"
                        : "border-border/70 hover:border-accent/50 cursor-pointer bg-white/[0.005] hover:bg-white/[0.01]"
                    )}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.csv,.txt"
                      className="hidden"
                      disabled={!aiEnabled || checkingAi}
                    />
                    <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        {checkingAi 
                          ? (isId ? "Memeriksa status AI..." : "Checking AI status...") 
                          : !aiEnabled 
                            ? (isId ? "Pindai AI Tidak Tersedia" : "AI Scan Unavailable") 
                            : file 
                              ? file.name 
                              : (isId ? "Klik atau seret file PDF/CSV di sini" : "Click or drag PDF/CSV file here")}
                      </p>
                      {file && aiEnabled && !checkingAi ? (
                        <p className="text-[10px] text-text-muted mt-1 font-mono">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      ) : (
                        <p className="text-[10px] text-text-muted mt-1">
                          PDF, CSV, atau TXT (maks. 15MB)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-elevated/40 border border-border/80 p-3.5 rounded-xl space-y-2 text-[11px] leading-relaxed text-text-muted">
                    <div className="flex items-center gap-1.5 text-text-primary font-bold">
                      <Info size={13} className="text-accent" />
                      <span>{isId ? "Petunjuk Format & AI:" : "Guidelines & AI Guidelines:"}</span>
                    </div>
                    <p className="leading-relaxed">
                      {isId
                        ? "Anda dapat mengunggah mutasi bank, e-statement PDF, atau file CSV dengan format kolom apa pun. AI DeepSeek akan membaca isi file dan mencocokkan kolom secara otomatis."
                        : "You can upload bank statement PDFs, e-statement files, or CSVs in any layout. DeepSeek AI automatically reads the file and maps random fields/columns."}
                    </p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px]">
                      <li><strong>PDF Terkunci</strong>: {isId ? "Mendukung pembacaan file terproteksi kata sandi secara aman." : "Supports reading password-protected statement files securely."}</li>
                      <li><strong>Revisi Instan</strong>: {isId ? "Anda dapat mengedit data transaksi secara langsung sebelum disimpan." : "You can edit parsed transaction details directly before saving."}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer for upload screen */}
            {!passwordRequired && (
              <div className="flex items-center justify-end gap-2.5 border-t border-border px-7 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isParsing}
                  className="h-10 px-5 rounded-xl text-xs font-semibold"
                >
                  {isId ? "Tutup" : "Close"}
                </Button>
                <Button
                  type="button"
                  onClick={() => parseFile("")}
                  disabled={isParsing || !file || !aiEnabled || checkingAi}
                  className="h-10 px-5 rounded-xl text-xs font-semibold gap-1.5"
                >
                  {isParsing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      {isId ? "Membaca..." : "Reading..."}
                    </>
                  ) : (
                    <>
                      {isId ? "Analisis Sekarang" : "Analyze Now"}
                      <ChevronRight size={13} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
