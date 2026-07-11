import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Loader2, Upload, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportCsvModal({ open, onClose, onSuccess }: ImportCsvModalProps) {
  const { language } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isId = language === "id";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".csv")) {
        setError(isId ? "Hanya file .csv yang diperbolehkan" : "Only .csv files are allowed");
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
    setResult(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (!selectedFile.name.endsWith(".csv")) {
        setError(isId ? "Hanya file .csv yang diperbolehkan" : "Only .csv files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError(isId ? "Pilih file terlebih dahulu" : "Please select a file first");
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post<{ imported: number; errors: string[] }>("/api/transactions/import", formData);
        setResult(res);
        if (res.imported > 0) {
          onSuccess();
        }
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : "";
        setError(message || (isId ? "Gagal mengimpor file" : "Failed to import file"));
      }
    });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="flex items-start gap-4 border-b border-border px-7 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
            <Upload size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {isId ? "Impor Transaksi dari CSV" : "Import Transactions from CSV"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
              {isId
                ? "Unggah file CSV dengan format kolom yang sesuai untuk mengimpor transaksi secara massal."
                : "Upload a CSV file with the matching column header layout to import batch transactions."}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {/* Info Format CSV */}
          <div className="bg-elevated/40 border border-border/80 p-3.5 rounded-xl space-y-2 text-[11px] leading-relaxed text-text-muted">
            <div className="flex items-center gap-1.5 text-text-primary font-bold">
              <Info size={13} className="text-accent" />
              <span>{isId ? "Petunjuk Format Kolom CSV:" : "CSV Column Layout Guidelines:"}</span>
            </div>
            <p className="font-mono bg-canvas/60 p-2 rounded text-[10px] select-all border border-border/40 overflow-x-auto whitespace-nowrap">
              Date, Type, Source Account, Destination Account, Category, Amount, Description, Note
            </p>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px]">
              <li><strong>Date</strong>: YYYY-MM-DD (e.g. 2026-06-12)</li>
              <li><strong>Type</strong>: <code className="text-accent">income</code>, <code className="text-accent">expense</code>, or <code className="text-accent">transfer</code></li>
              <li><strong>Source Account</strong>: {isId ? "Nama rekening pengirim (harus cocok persis)" : "Sender account name (exact match)"}</li>
              <li><strong>Destination Account</strong>: {isId ? "Nama rekening penerima (hanya untuk transfer)" : "Recipient account name (transfer only)"}</li>
              <li><strong>Category</strong>: {isId ? "Nama kategori pengeluaran/pendapatan" : "Budget category name"}</li>
              <li><strong>Amount</strong>: {isId ? "Angka desimal/bulat (tanpa simbol Rp/Rp.)" : "Numeric format without currency symbol"}</li>
            </ul>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/70 hover:border-accent/50 rounded-2xl p-6 text-center cursor-pointer transition bg-white/[0.005] hover:bg-white/[0.01] flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">
                {file ? file.name : (isId ? "Klik atau seret file CSV ke sini" : "Click or drag CSV file here")}
              </p>
              {file && (
                <p className="text-[10px] text-text-muted mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>

          {/* Errors & Alerts */}
          {error && (
            <div className="p-3 bg-expense/10 border border-expense/20 rounded-xl flex gap-2 text-xs text-expense">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div className="break-all">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-2.5">
              <div className="p-3 bg-income/10 border border-income/20 rounded-xl flex gap-2 text-xs text-income">
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong>{result.imported}</strong> {isId ? "transaksi berhasil diimpor!" : "transactions successfully imported!"}
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="max-h-[120px] overflow-y-auto border border-border p-3 rounded-xl bg-elevated/20 space-y-1">
                  <p className="text-[10px] font-bold text-expense uppercase tracking-wider">
                    {isId ? "Kesalahan baris:" : "Row-level warnings/errors:"}
                  </p>
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-[10px] text-text-muted font-mono leading-tight">
                      • {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border px-7 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
            className="h-10 px-5 rounded-xl text-xs font-semibold"
          >
            {isId ? "Tutup" : "Close"}
          </Button>
          {!result && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="h-10 px-5 rounded-xl text-xs font-semibold gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  {isId ? "Mengimpor..." : "Importing..."}
                </>
              ) : (
                isId ? "Impor Sekarang" : "Import Now"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
