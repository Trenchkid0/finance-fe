import { useRef } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { scanTransactionText } from "@/app/actions/ai";
import type { AIScanCandidate } from "@/app/actions/ai";

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

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 text-center cursor-pointer"
      onClick={() => !scanning && fileInputRef.current?.click()}
      role="button"
    >
      {scanning ? (
        <>
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">
            {isId ? "Membaca struk…" : "Reading receipt…"}
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleScanFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
