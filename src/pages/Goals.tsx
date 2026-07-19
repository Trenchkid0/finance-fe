import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR, formatDate } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Plus, Target, Edit2, Trash2, Calendar, PiggyBank, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import { SkeletonGoals } from "@/components/ui/skeleton-loader";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";

interface SavingsGoal {
  id: string; name: string; targetAmount: number;
  currentAmount: number; targetDate: string;
  accountId?: string | null; note?: string;
  account?: { id: string; name: string } | null;
}

// Circular arc progress ring
function ArcProgress({ pct, size = 80, stroke = 6, color = "var(--accent)" }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--border)" strokeWidth={stroke} strokeOpacity={0.3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
    </svg>
  );
}

export default function Goals() {
  const { language, t } = useLanguage();
  const { accounts } = useApp();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  const isId = language === "id";

  const fetchGoals = async () => {
    const cached = cache.get<SavingsGoal[]>(CacheKeys.goals());
    if (cached) { setGoals(cached); setLoading(false); return; }
    try {
      setLoading(true);
      const data = await api.get<SavingsGoal[]>("/api/goals");
      setGoals(data || []);
      cache.set(CacheKeys.goals(), data || [], CacheTTL.MEDIUM);
    } catch { setGoals([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleFormSubmit = async (data: GoalFormData) => {
    if (editingGoal?.id) {
      await api.put(`/api/goals/${editingGoal.id}`, data);
      toast.success(t("goalUpdateSuccess"));
    } else {
      await api.post("/api/goals", data);
      toast.success(t("goalAddSuccess"));
    }
    cache.delete(CacheKeys.goals());
    fetchGoals();
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    try {
      await api.delete(`/api/goals/${deletingGoal.id}`);
      toast.success(t("goalDeleteSuccess"));
      setDeletingGoal(null);
      cache.delete(CacheKeys.goals());
      fetchGoals();
    } catch { toast.error(t("goalDeleteFailed")); }
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const avgProgress = goals.length > 0 && totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {t("goals")}
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1.5">{t("goalsPageSubtitle")}</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
          className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
          <Plus size={14} strokeWidth={2.5} /> {t("addGoal")}
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: isId ? "Total Target" : "Total Target",
            value: formatIDR(totalTarget),
            icon: Target, color: "accent" as const,
          },
          {
            label: isId ? "Total Tersimpan" : "Total Saved",
            value: formatIDR(totalSaved),
            icon: PiggyBank, color: "income" as const,
          },
          {
            label: isId ? "Rata-rata Progres" : "Avg Progress",
            value: `${avgProgress.toFixed(1)}%`,
            icon: TrendingUp, color: "accent" as const,
            progress: avgProgress,
          },
          {
            label: isId ? "Tujuan Selesai" : "Goals Completed",
            value: `${completedCount} / ${goals.length}`,
            icon: CheckCircle2, color: "income" as const,
          },
        ].map(({ label, value, icon: Icon, color, progress }) => (
          <Card key={label} className={cn(
            "p-4 gap-0 relative overflow-hidden group transition-all duration-300",
            "hover:border-accent/30"
          )}>
            <div className={cn("absolute top-3 right-3 size-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
              color === "income" ? "bg-income/10 text-income" : "bg-accent/10 text-accent"
            )}>
              <Icon size={15} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">{label}</p>
            <p className={cn("text-lg font-extrabold font-mono tabular-nums",
              color === "income" ? "text-income" : "text-accent"
            )}>{value}</p>
            {progress !== undefined && (
              <div className="mt-3 h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ── Goal Cards ── */}
      {loading ? <SkeletonGoals /> : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-muted/5 text-center min-h-[280px]">
          <div className="size-14 rounded-2xl bg-elevated border border-border flex items-center justify-center text-muted-foreground/60 mb-4">
            <PiggyBank size={26} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("noGoalsSet")}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-[260px]">{t("noGoalsDesc")}</p>
          <Button onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
            variant="outline" className="mt-5 h-8 rounded-lg text-xs font-semibold px-4">
            {t("createFirstGoal")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const targetDateObj = new Date(goal.targetDate);
            const today = new Date();
            const diffYear = targetDateObj.getFullYear() - today.getFullYear();
            const diffMonth = targetDateObj.getMonth() - today.getMonth();
            const remainingMonths = diffYear * 12 + diffMonth;
            const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isOverdue = remainingAmount > 0 && remainingMonths <= 0;
            const isComplete = remainingAmount === 0;

            const arcColor = isComplete
              ? "var(--income)"
              : isOverdue
              ? "var(--expense)"
              : "var(--accent)";

            let projectionText = "";
            if (isComplete) projectionText = t("projectionAchieved");
            else if (isOverdue) projectionText = t("projectionDueNow");
            else {
              const monthlyReq = Math.ceil(remainingAmount / remainingMonths);
              projectionText = `${formatIDR(monthlyReq)} ${t("projectionMonth")} ${t("projectionLeft")}`;
            }

            return (
              <Card key={goal.id} className="p-5 group hover:border-accent/30 transition-all duration-300 hover:shadow-lg flex flex-col gap-0">
                <div className="flex items-start justify-between gap-3">
                  {/* Arc Ring */}
                  <div className="relative flex-shrink-0">
                    <ArcProgress pct={pct} size={72} stroke={5} color={arcColor} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black font-mono tabular-nums text-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground leading-tight truncate">{goal.name}</h3>
                        {goal.account && (
                          <span className="text-[9px] font-semibold text-muted-foreground/60 bg-muted/30 border border-border/40 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {goal.account.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeletingGoal(goal)}
                          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-expense hover:bg-expense/10 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Saved vs Target */}
                    <div className="mt-2.5 flex items-baseline gap-1.5 font-mono tabular-nums">
                      <span className={cn("text-sm font-extrabold", isComplete ? "text-income" : "text-foreground")}>
                        {formatIDR(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">/</span>
                      <span className="text-xs text-muted-foreground/60">{formatIDR(goal.targetAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {goal.note && (
                  <p className="text-xs text-muted-foreground/60 mt-3 italic line-clamp-1">"{goal.note}"</p>
                )}

                {/* Segmented progress bar with milestone ticks */}
                <div className="mt-4 space-y-2">
                  <div className="relative h-2 w-full bg-border/20 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: arcColor }} />
                    {[25, 50, 75].map((mark) => (
                      <div key={mark}
                        style={{ left: `${mark}%` }}
                        className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-1.5 rounded-full transition-all duration-300",
                          pct >= mark ? "bg-white shadow-[0_0_4px_#fff]" : "bg-white/10"
                        )} />
                    ))}
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      isComplete ? "bg-income/10 text-income border-income/20"
                        : isOverdue ? "bg-expense/10 text-expense border-expense/20 animate-pulse"
                        : "bg-accent/8 text-accent border-accent/20"
                    )}>
                      {isComplete ? "✓ " : isOverdue ? "⚠ " : ""}{projectionText}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 font-medium">
                      <Clock size={10} /> {formatDate(goal.targetDate, language)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <GoalForm open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGoal(null); }}
        goal={editingGoal ?? undefined} accounts={accounts} onSubmit={handleFormSubmit} />

      <Dialog open={!!deletingGoal} onOpenChange={(o) => !o && setDeletingGoal(null)}>
        <DialogContent className="bg-elevated border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{t("deleteGoalTitle")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">{t("deletePermanentDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeletingGoal(null)} className="h-8 rounded-lg text-xs font-semibold">
              {t("cancelButton")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}
              className="bg-expense hover:bg-red-600 text-white h-8 rounded-lg text-xs font-semibold">
              {t("deleteOption")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}