import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils/cn";

interface CustomSingleDatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function CustomSingleDatePicker({
  value,
  onChange,
}: CustomSingleDatePickerProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() => {
    const currentYear = value ? new Date(value).getFullYear() : new Date().getFullYear();
    return Math.floor(currentYear / 16) * 16;
  });

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 320;
      const popupWidth = 280;

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
      if (left < 10) {
        left = 10;
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
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      const contentEl = document.getElementById("single-date-picker-content-shared");
      if (contentEl && contentEl.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  useEffect(() => {
    const vYear = viewDate.getFullYear();
    setYearPageStart(Math.floor(vYear / 16) * 16);
  }, [viewDate]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  let startOffset = new Date(year, month, 1).getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev - 16);
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "years") {
      setYearPageStart((prev) => prev + 16);
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatFriendlyDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const label = value ? formatFriendlyDate(value) : (language === "id" ? "Pilih Tanggal" : "Select Date");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:border-white/[0.12] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 ease-out"
      >
        <span>{label}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            id="single-date-picker-content-shared"
            style={{ position: "fixed", top: "0", left: "0" }}
            className="p-4 w-[280px] rounded-2xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col gap-3.5 text-text-primary shadow-2xl z-[99999]"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                {viewMode === "years" ? (
                  <span className="px-1.5 py-0.5 text-xs font-bold text-text-primary font-mono">
                    {yearPageStart} — {yearPageStart + 15}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode(viewMode === "months" ? "days" : "months");
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors",
                        viewMode === "months" && "bg-white/[0.08] text-accent hover:text-accent"
                      )}
                    >
                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month].substring(0, 3)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode("years");
                      }}
                      className="px-1.5 py-0.5 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide hover:bg-white/[0.06] hover:text-accent transition-colors font-mono"
                    >
                      {year}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={viewMode === "months"}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={
                    viewMode === "months" ||
                    (viewMode === "years" && yearPageStart + 15 >= currentYear) ||
                    (viewMode === "days" && (year > currentYear || (year === currentYear && month >= currentMonth)))
                  }
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {viewMode === "days" && (
              <>
                <div className="grid grid-cols-7 text-center">
                  {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, idx) => (
                    <span key={idx} className="text-[9px] font-bold text-text-muted uppercase">{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-mono">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="h-7 w-7" />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = value === dateStr;
                    const todayStr = getLocalDateString();
                    const isToday = dateStr === todayStr;
                    const isFuture = dateStr > todayStr;
                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        disabled={isFuture}
                        onClick={(e) => handleDayClick(day, e)}
                        className={cn(
                          "h-8 w-8 text-xs rounded-lg flex items-center justify-center font-semibold transition-all cursor-pointer",
                          isSelected ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : isToday ? "border border-accent/50 text-accent font-bold" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]",
                          isFuture && "opacity-30 pointer-events-none"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-2 py-1">
                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, mIdx) => {
                  const isFutureMonth = year > currentYear || (year === currentYear && mIdx > currentMonth);
                  return (
                    <button
                      key={mIdx}
                      type="button"
                      disabled={isFutureMonth}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewDate(new Date(year, mIdx, 1));
                        setViewMode("days");
                      }}
                      className={cn(
                        "h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center",
                        mIdx === month ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]",
                        isFutureMonth && "opacity-30 pointer-events-none"
                      )}
                    >
                      {m.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === "years" && (
              <div className="grid grid-cols-4 gap-2 py-1">
                {Array.from({ length: 16 }, (_, i) => yearPageStart + i).map((y) => {
                  const isFutureYear = y > currentYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      disabled={isFutureYear}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewDate(new Date(y, month, 1));
                        setViewMode("months");
                      }}
                      className={cn(
                        "h-10 text-xs rounded-lg font-semibold transition-all cursor-pointer text-center font-mono",
                        y === year ? "bg-accent text-white font-bold shadow-lg shadow-accent/30" : "text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]",
                        isFutureYear && "opacity-30 pointer-events-none"
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-white/[0.06]" />

            <div className="flex items-center justify-between gap-1.5">
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={value}
                onChange={(e) => {
                  const val = e.target.value;
                  const todayStr = getLocalDateString();
                  if (val.length === 10 && val > todayStr) {
                    onChange(todayStr);
                    setViewDate(new Date());
                  } else {
                    onChange(val);
                    const parseD = new Date(val);
                    if (!isNaN(parseD.getTime())) setViewDate(parseD);
                  }
                }}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all font-mono"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
