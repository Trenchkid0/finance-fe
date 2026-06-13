import { useRef, useEffect, useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { scanTransactionText } from "@/app/actions/ai";
import type { AIScanCandidate } from "@/app/actions/ai";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

const TESSERACT_CDN = "https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js";

interface ReceiptScannerProps {
  scanning: boolean;
  setScanning: (s: boolean) => void;
  onScanComplete: (candidate: AIScanCandidate, file: File) => void;
}

export function ReceiptScanner({
  scanning,
  setScanning,
  onScanComplete,
}: ReceiptScannerProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    api.get<{ enabled: boolean }>("/api/ai/status")
      .then((res) => {
        if (active) {
          setAiEnabled(res.enabled);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch AI status:", err);
        if (active) {
          setAiEnabled(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleScanFile = async (file: File) => {
    setScanning(true);
    try {
      // @ts-expect-error - loaded dynamically from CDN
      if (!window.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = TESSERACT_CDN;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Tesseract load failed"));
          document.body.appendChild(s);
        });
      }
      // @ts-expect-error - Tesseract global from CDN
      const { data } = await window.Tesseract.recognize(file, "ind+eng");
      const text: string = data?.text ?? "";

      const result = await scanTransactionText(text);

      if (result.ok) {
        onScanComplete(result.candidate, file);
        toast.success(isId ? "Struk berhasil dibaca" : "Receipt scanned");
      } else if ("error" in result) {
        toast.error(result.error || (isId ? "Gagal membaca struk" : "Couldn't read the receipt"));
      } else {
        toast.error(isId ? "Gagal membaca struk" : "Couldn't read the receipt");
      }
    } catch (err) {
      console.error(err);
      toast.error(isId ? "Pemindaian gagal" : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const isDisabled = aiEnabled === false;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-200",
        isDisabled
          ? "border-white/[0.06] bg-white/[0.01] cursor-not-allowed opacity-60"
          : "border-white/[0.12] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.18]"
      )}
      onClick={() => !scanning && !isDisabled && fileInputRef.current?.click()}
      role="button"
      aria-disabled={isDisabled}
    >
      {scanning ? (
        <>
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">
            {isId ? "Membaca struk…" : "Reading receipt…"}
          </p>
        </>
      ) : isDisabled ? (
        <>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-muted-foreground/60">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/90">
            {isId ? "Scan AI Tidak Aktif" : "AI Scan Inactive"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50 max-w-[280px]">
            {isId
              ? "Layanan Scan AI dinonaktifkan karena DEEPSEEK_API_KEY belum dikonfigurasi di server."
              : "AI Scan is disabled because DEEPSEEK_API_KEY is not configured on the server."}
          </p>
        </>
      ) : (
        <>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {isId ? "Unggah foto struk" : "Upload a receipt photo"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {isId
              ? "AI akan mengisi form otomatis"
              : "AI will fill the form for you"}
          </p>
          <Badge variant="secondary" className="mt-3 gap-1">
            <Sparkles className="h-3 w-3" /> AI
          </Badge>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isDisabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleScanFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
