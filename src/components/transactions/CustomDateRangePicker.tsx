import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export function formatFriendlyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

interface CustomDateRangePickerProps {
  startDate: string;
  endDate: string;
  onPick: (range: { start: string; end: string }) => void;
}

export function CustomDateRangePicker({
  startDate,
  endDate,
  onPick,
}: CustomDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [viewDate, setViewDate] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() => {
    const currentYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    return Math.floor(currentYear / 16) * 16;
  });

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 500;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      if (top + popupHeight > window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top - popupHeight - 8;
      }
      
      if (left + 280 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 290);
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
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      const contentEl = document.getElementById("date-range-picker-content");
      if (contentEl && contentEl.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  useEffect(() => {
    const vYear = viewDate.getFullYear();
    setYearPageStart(Math.floor(vYear / 16) * 16);
  }, [viewDate]);

  useEffect(() => {
    if (isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      const d = startDate ? new Date(startDate) : new Date();
      setViewDate(isNaN(d.getTime()) ? new Date() : d);
    }
  }, [isOpen, startDate, endDate]);

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

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd("");
    } else {
      if (new Date(dateStr) < new Date(tempStart)) {
        setTempStart(dateStr);
        setTempEnd("");
      } else {
        setTempEnd(dateStr);
        onPick({ start: tempStart, end: dateStr });
        setIsOpen(false);
      }
    }
  };

  let label = "Pilih Tanggal";
  if (startDate && endDate) {
    if (startDate === endDate) {
      label = formatFriendlyDate(startDate);
    } else {
      label = `${formatFriendlyDate(startDate)} — ${formatFriendlyDate(endDate)}`;
    }
  } else if (startDate) {
    label = `Mulai ${formatFriendlyDate(startDate)}`;
  } else if (endDate) {
    label = `Sampai ${formatFriendlyDate(endDate)}`;
  } else {
    label = "Semua Waktu";
  }

  return (
    <div className="relative z-50">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 gap-2 px-3 text-xs font-semibold text-text-primary bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all relative group"
        style={{ borderRadius: "var(--custom-dropdown-radius, 8px)" }}
      >
        <Calendar size={12} className="text-text-muted pointer-events-none" />
        <span>{label}</span>
        {(startDate || endDate) ? (
          <span
            role="button"
            aria-label="Clear date range"
            onClick={(e) => {
              e.stopPropagation();
              onPick({ start: "", end: "" });
            }}
            className="hover:text-expense p-0.5 rounded transition-colors ml-0.5 z-10 flex items-center justify-center"
          >
            <X size={10} className="opacity-80 hover:opacity-100" />
          </span>
        ) : (
          <ChevronDown size={12} className="text-text-muted opacity-60 ml-0.5" />
        )}
      </Button>
      
      {isOpen && createPortal(
        <div
          ref={containerRef}
          id="date-range-picker-content"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            borderRadius: "var(--custom-dropdown-menu-radius, 12px)",
          }}
          className="p-4 w-[280px] border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col gap-3.5 text-text-primary shadow-2xl z-[100000] max-h-[500px] overflow-y-auto"
        >
          {/* Calendar Control Header */}
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
                    {[
                      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                    ][month].substring(0, 3)}
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
                disabled={viewMode === "months"}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* View Grid based on mode */}
          {viewMode === "days" && (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center">
                {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, idx) => (
                  <span key={idx} className="text-[9px] font-bold text-text-muted uppercase">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-7 w-7" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelectedStart = tempStart === dateStr;
                  const isSelectedEnd = tempEnd === dateStr;
                  const isInRange =
                    tempStart &&
                    tempEnd &&
                    new Date(dateStr) > new Date(tempStart) &&
                    new Date(dateStr) < new Date(tempEnd);

                  const isToday = dateStr === new Date().toLocaleDateString("sv-SE");
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleDayClick(day, e)}
                      className={cn(
                        "h-7 w-7 rounded text-[11px] font-medium transition-all duration-150",
                        isSelectedStart || isSelectedEnd
                          ? "bg-accent text-white"
                          : isInRange
                          ? "bg-accent/15 text-accent font-medium"
                          : isToday
                          ? "bg-accent/10 text-accent border border-accent/25"
                          : "hover:bg-white/[0.06] hover:text-text-primary text-text-muted"
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
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }).map((_, mIdx) => (
                <button
                  key={mIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDate(new Date(year, mIdx, 1));
                    setViewMode("days");
                  }}
                  className="py-2 text-[11px] font-medium rounded hover:bg-white/[0.06] hover:text-text-primary text-text-muted transition-colors"
                >
                  {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][mIdx]}
                </button>
              ))}
            </div>
          )}

          {viewMode === "years" && (
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 16 }).map((_, idx) => {
                const y = yearPageStart + idx;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(y, 0, 1));
                      setViewMode("months");
                    }}
                    className={cn(
                      "py-2 text-[11px] font-medium rounded transition-colors font-mono",
                      y === year
                        ? "bg-accent text-white"
                        : "hover:bg-white/[0.06] hover:text-text-primary text-text-muted"
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
