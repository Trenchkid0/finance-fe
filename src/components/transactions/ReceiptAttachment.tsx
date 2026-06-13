import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ReceiptAttachmentProps {
  receiptFile: File | null;
  setReceiptFile: (f: File | null) => void;
  receiptImage: string | null;
  setReceiptImage: (img: string | null) => void;
  receiptUrl: string | null;
  setReceiptUrl: (url: string | null) => void;
}

export function ReceiptAttachment({
  receiptFile,
  setReceiptFile,
  receiptImage,
  setReceiptImage,
  receiptUrl,
  setReceiptUrl,
}: ReceiptAttachmentProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

  return (
    <div className="space-y-2.5">
      <Label className={labelCls}>
        {isId ? "Foto Struk (opsional)" : "Receipt Photo (optional)"}
      </Label>
      <div className="relative">
        {receiptImage ? (
          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] flex items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={receiptImage}
                alt="Receipt preview"
                className="w-16 h-16 rounded-lg object-cover bg-black/40 border border-white/[0.08]"
              />
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {receiptFile ? receiptFile.name : (isId ? "Foto struk terlampir" : "Attached receipt")}
                </p>
                {receiptFile && (
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setReceiptFile(null);
                setReceiptImage(null);
                setReceiptUrl(null);
                if (receiptInputRef.current) receiptInputRef.current.value = "";
              }}
              className="h-8 w-8 text-expense hover:bg-expense/10 hover:text-expense shrink-0 rounded-lg"
            >
              <X size={14} />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            className="w-full h-20 border border-dashed border-white/[0.12] hover:border-accent/40 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl flex flex-col items-center justify-center gap-1 text-text-muted hover:text-text-primary transition-all duration-200"
          >
            <Upload size={16} className="text-accent" />
            <span className="text-[11px] font-semibold">
              {isId ? "Unggah Foto Struk" : "Upload Receipt Photo"}
            </span>
            <span className="text-[9px] text-text-muted/70">
              PNG, JPG, JPEG (max. 5MB)
            </span>
          </button>
        )}
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
              toast.error(isId ? "Ukuran file maksimal 5MB" : "Maximum file size is 5MB");
              return;
            }

            // Check file type
            if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
              toast.error(
                isId
                  ? "Format file harus PNG, JPG, atau JPEG"
                  : "File format must be PNG, JPG, or JPEG"
              );
              return;
            }

            setReceiptFile(file);

            // Preview image
            const reader = new FileReader();
            reader.onload = (ev) => {
              setReceiptImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </div>
  );
}
