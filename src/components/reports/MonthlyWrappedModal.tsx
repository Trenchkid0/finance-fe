import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, ChevronRight, ChevronLeft, Flame, Wallet, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";

interface CategoryHighlight {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

interface DayHighlight {
  date: string;
  amount: number;
}

interface MonthlyWrappedData {
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  savingsRate: number;
  topCategory?: CategoryHighlight;
  biggestDay?: DayHighlight;
  totalCount: number;
  personalityBadge: string;
  badgeDescription: string;
}

interface MonthlyWrappedModalProps {
  open: boolean;
  onClose: () => void;
}

export function MonthlyWrappedModal({ open, onClose }: MonthlyWrappedModalProps) {
  const [data, setData] = useState<MonthlyWrappedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [slideIndex, setSlideIndex] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    const fetchWrappedData = async () => {
      try {
        setLoading(true);
        const res = await api.get<MonthlyWrappedData>("/api/reports/monthly-wrapped");
        setData(res);
      } catch (err) {
        console.error("Failed to load monthly wrapped:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWrappedData();
  }, [open]);

  if (!open) return null;

  const totalSlides = 4;

  const nextSlide = () => setSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setSlideIndex((prev) => Math.max(prev - 1, 0));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex size-full max-w-md flex-col overflow-hidden rounded-3xl border border-accent/30 bg-surface/95 shadow-2xl backdrop-blur-xl">
        {/* Top bar indicators */}
        <div className="absolute top-4 inset-x-6 z-20 flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= slideIndex ? "bg-accent" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-6 z-20 flex size-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <X size={16} />
        </button>

        {/* Body content based on slide */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10 pt-16">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              <span className="text-xs text-muted-foreground">Menyiapkan Rekap Bulanan Anda...</span>
            </div>
          ) : data ? (
            <>
              {/* SLIDE 0: Overview */}
              {slideIndex === 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="size-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto text-accent shadow-lg shadow-accent/10">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Financial Wrapped</span>
                    <h2 className="text-3xl font-extrabold text-foreground mt-1">
                      {data.monthName} {data.year}
                    </h2>
                  </div>

                  <div className="space-y-3 bg-elevated/40 border border-border/50 rounded-2xl p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                      <p className="text-2xl font-extrabold font-mono text-expense mt-0.5">{formatIDR(data.totalExpense)}</p>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">Total Penghematan</p>
                      <p className="text-xl font-bold font-mono text-income mt-0.5">{formatIDR(data.totalSaved)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 1: Top Category */}
              {slideIndex === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="size-16 rounded-2xl bg-income/15 border border-income/30 flex items-center justify-center mx-auto text-income shadow-lg shadow-income/10">
                    <Flame size={32} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pengeluaran Terbesar</span>
                    <h2 className="text-2xl font-extrabold text-foreground mt-1">
                      {data.topCategory ? data.topCategory.name : "Belum Ada Data"}
                    </h2>
                  </div>

                  {data.topCategory && (
                    <div className="bg-elevated/40 border border-border/50 rounded-2xl p-6 space-y-2">
                      <span className="text-4xl">{data.topCategory.icon || "📦"}</span>
                      <p className="text-2xl font-extrabold font-mono text-accent">{formatIDR(data.topCategory.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Menyumbang {data.topCategory.percentage.toFixed(0)}% dari seluruh pengeluaran Anda sebulan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SLIDE 2: Biggest Expense Day */}
              {slideIndex === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="size-16 rounded-2xl bg-expense/15 border border-expense/30 flex items-center justify-center mx-auto text-expense shadow-lg shadow-expense/10">
                    <Wallet size={32} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hari Paling Boros</span>
                    <h2 className="text-2xl font-extrabold text-foreground mt-1">
                      {data.biggestDay ? data.biggestDay.date : "Sangat Hemat!"}
                    </h2>
                  </div>

                  {data.biggestDay && (
                    <div className="bg-elevated/40 border border-border/50 rounded-2xl p-6 space-y-2">
                      <p className="text-3xl font-extrabold font-mono text-expense">{formatIDR(data.biggestDay.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Tanggal ini mencatat transaksi terbesar dalam satu hari!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SLIDE 3: Personality Badge */}
              {slideIndex === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="size-20 rounded-3xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent shadow-xl shadow-accent/20">
                    <Trophy size={40} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Lencana Keuangan Anda</span>
                    <h2 className="text-2xl font-extrabold text-foreground mt-1">
                      {data.personalityBadge}
                    </h2>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5">
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      "{data.badgeDescription}"
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Bottom controls */}
        <div className="p-6 flex items-center justify-between border-t border-border/40 relative z-10">
          <Button
            size="sm"
            variant="ghost"
            onClick={prevSlide}
            disabled={slideIndex === 0}
            className="text-xs text-muted-foreground"
          >
            <ChevronLeft size={16} /> Kembali
          </Button>

          {slideIndex < totalSlides - 1 ? (
            <Button size="sm" onClick={nextSlide} className="text-xs font-bold gap-1 bg-accent text-black hover:bg-accent/90">
              Lanjut <ChevronRight size={16} />
            </Button>
          ) : (
            <Button size="sm" onClick={onClose} className="text-xs font-bold bg-accent text-black hover:bg-accent/90">
              Selesai ✨
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
