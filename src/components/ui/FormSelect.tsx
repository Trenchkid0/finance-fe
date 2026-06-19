import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: FormSelectOption[];
  placeholder: string;
  className?: string;
}

export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? placeholder;

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 250;
      const popupWidth = triggerRect.width;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top = triggerRect.bottom + 8;

      if (spaceBelow < popupHeight + 10 && spaceAbove > spaceBelow) {
        top = triggerRect.top - popupHeight - 8;
      }

      top = Math.max(10, Math.min(top, window.innerHeight - popupHeight - 10));

      let left = triggerRect.left;
      if (left + popupWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popupWidth - 10);
      }

      containerRef.current.style.top = `${top}px`;
      containerRef.current.style.left = `${left}px`;
      containerRef.current.style.width = `${popupWidth}px`;
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
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-elevated/50 px-4 py-2 text-sm text-foreground hover:border-hover-border hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-elevated transition-all duration-300 ease-out text-left"
      >
        <span className={value ? "" : "text-muted-foreground/50"}>{selectedLabel}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            borderRadius: "12px",
          }}
          className="p-1 border border-border bg-popover backdrop-blur-xl flex flex-col text-foreground shadow-2xl shadow-black/10 dark:shadow-black/45 z-[100000] max-h-[300px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-4 text-xs font-semibold outline-none transition-colors duration-200 text-left hover:bg-hover-surface ${
                opt.value === value ? "bg-elevated text-foreground font-semibold" : "text-muted-foreground"
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
