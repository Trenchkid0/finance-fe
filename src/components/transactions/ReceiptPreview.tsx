import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface ReceiptPreviewProps {
  imageUrl: string;
  transactionDescription?: string;
  onClose: () => void;
}

/**
 * Full-screen receipt image preview with download.
 * Renders via createPortal to avoid layout shift and z-index issues.
 */
export function ReceiptPreview({ imageUrl, transactionDescription, onClose }: ReceiptPreviewProps) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [handleKeyDown]);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = transactionDescription
        ? `receipt-${transactionDescription.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`
        : "receipt.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Top toolbar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-white/70 truncate max-w-[300px]">
            {transactionDescription || t("receiptLabel")}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            title={t("downloadReceipt")}
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t("downloadReceipt")}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={t("closePreview")}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-16 pointer-events-none">
        <img
          src={imageUrl}
          alt={transactionDescription || t("receiptLabel")}
          className="max-h-full max-w-full object-contain shadow-2xl"
          draggable={false}
        />
      </div>
    </div>,
    document.body,
  );
}
