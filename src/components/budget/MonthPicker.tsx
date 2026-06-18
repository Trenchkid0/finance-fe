import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils/cn";

interface MonthPickerProps {
  monthLabel: string;
  year: number;
  month: number;
  yearOptions: number[];
  onPrev: () => void;
  onNext: () => void;
  onPick: (y: number, m: number) => void;
  pending: boolean;
}

export function MonthPicker({
  monthLabel,
  year,
  month,
  yearOptions,
  onPrev,
  onNext,
  onPick,
  pending,
}: MonthPickerProps) {
  const { language } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedYear, setPickedYear] = useState(year);
  const pickerTriggerRef = useRef<HTMLDivElement>(null);
  const pickerContentRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;

  const canGoNext = !(year === currentY && month >= currentM);

  const updatePosition = () => {
    if (pickerTriggerRef.current && pickerContentRef.current) {
      const triggerRect = pickerTriggerRef.current.getBoundingClientRect();
      const popupHeight = 220;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      if (top + popupHeight > window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top - popupHeight - 8;
      }
      
      if (left + 260 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 270);
      }
      
      if (left < 10) {
        left = 10;
      }
      
      pickerContentRef.current.style.top = `${top}px`;
      pickerContentRef.current.style.left = `${left}px`;
    }
  };

  useLayoutEffect(() => {
    if (pickerOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (pickerTriggerRef.current && pickerTriggerRef.current.contains(e.target as Node)) {
        return;
      }
      if (pickerContentRef.current && pickerContentRef.current.contains(e.target as Node)) {
        return;
      }
      setPickerOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [pickerOpen]);

  useEffect(() => {
    if (pickerOpen) {
      setPickedYear(year);
    }
  }, [pickerOpen, year]);

  return (
    <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1.5 shrink-0 self-start sm:self-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/[0.04] transition-colors rounded-lg text-muted-foreground/60 hover:text-foreground"
        onClick={onPrev}
        aria-label={language === "id" ? "Bulan sebelumnya" : "Previous month"}
        disabled={pending}
      >
        <ChevronLeft size={16} />
      </Button>

      <div ref={pickerTriggerRef} className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-xs font-bold text-foreground"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span>{monthLabel}</span>
          <ChevronDown
            size={12}
            className={cn(
              "text-muted-foreground/60 transition-transform duration-200",
              pickerOpen && "rotate-180"
            )}
          />
        </button>

        {pickerOpen && (
          <YearMonthPanel
            pickedYear={pickedYear}
            onPickedYearChange={setPickedYear}
            yearOptions={yearOptions}
            currentYear={currentY}
            currentMonth={currentM}
            selectedYear={year}
            selectedMonth={month}
            panelRef={pickerContentRef}
            onPick={(y, m) => {
              setPickerOpen(false);
              onPick(y, m);
            }}
          />
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/[0.04] transition-colors rounded-lg text-muted-foreground/60 hover:text-foreground"
        onClick={onNext}
        aria-label={language === "id" ? "Bulan berikutnya" : "Next month"}
        disabled={pending || !canGoNext}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}

function YearMonthPanel({
  pickedYear,
  onPickedYearChange,
  yearOptions,
  currentYear,
  currentMonth,
  selectedYear,
  selectedMonth,
  panelRef,
  onPick,
}: {
  pickedYear: number;
  onPickedYearChange: (y: number) => void;
  yearOptions: number[];
  currentYear: number;
  currentMonth: number;
  selectedYear: number;
  selectedMonth: number;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onPick: (y, m: number) => void;
}) {
  const { language } = useLanguage();
  const minYear = Math.min(...yearOptions);
  const maxYear = Math.max(currentYear, ...yearOptions);

  const monthLabels =
    language === "id"
      ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: "0",
        left: "0",
      }}
      className="z-[99999] w-[260px] rounded-2xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPickedYearChange(pickedYear - 1)}
          disabled={pickedYear <= minYear}
          aria-label={language === "id" ? "Tahun sebelumnya" : "Previous year"}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-sm font-semibold text-text-primary font-mono">
          {pickedYear}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPickedYearChange(pickedYear + 1)}
          disabled={pickedYear >= maxYear}
          aria-label={language === "id" ? "Tahun berikutnya" : "Next year"}
        >
          <ChevronRight size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {monthLabels.map((label, idx) => {
          const m = idx + 1;
          const isFuture =
            pickedYear > currentYear || (pickedYear === currentYear && m > currentMonth);
          const isSelected = pickedYear === selectedYear && m === selectedMonth;

          return (
            <button
              key={label}
              type="button"
              onClick={() => !isFuture && onPick(pickedYear, m)}
              disabled={isFuture}
              className={cn(
                "px-2 py-2 rounded-md text-xs font-semibold transition-all duration-150",
                isSelected
                  ? "bg-accent text-white"
                  : isFuture
                    ? "text-text-muted/30 cursor-not-allowed"
                    : "text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-border"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
