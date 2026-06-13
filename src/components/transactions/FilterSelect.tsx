import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterSelectOption[];
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? label;

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 250;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      if (top + popupHeight > window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top - popupHeight - 8;
      }
      
      if (left + 176 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 186);
      }
      
      containerRef.current.style.top = `${top}px`;
      containerRef.current.style.left = `${left}px`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  return (
    <div className="grid gap-1.5 sm:gap-1 w-full lg:w-44">
      <Label className="sr-only">{label}</Label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 ease-out text-left"
        style={{ borderRadius: "var(--custom-dropdown-radius, 9999px)" }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            borderRadius: "var(--custom-dropdown-menu-radius, 12px)",
          }}
          className="p-1 w-[176px] border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col text-text-primary shadow-2xl z-[100000] max-h-[300px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-4 text-xs font-semibold outline-none transition-colors duration-200 text-left hover:bg-white/[0.06] ${
                opt.value === value ? "bg-white/[0.04] text-foreground font-semibold" : "text-muted-foreground"
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
