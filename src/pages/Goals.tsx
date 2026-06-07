import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR, formatDate } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Plus, Target, Edit2, Trash2, Calendar, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// ⬇️ pakai modal baru, bukan GoalForm lama
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  accountId?: string | null;
  note?: string;
  account?: { id: string; name: string } | null;
}

export default function Goals() {
  const { language } = useLanguage();
  const { accounts } = useApp();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Delete Confirm State
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.get<SavingsGoal[]>("/api/goals");
      setGoals(data || []);
    } catch (err) {
      console.error("Error fetching goals", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null); // null = mode tambah
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  // GoalModal akan menangkap error yang dilempar di sini dan menampilkannya
  const handleFormSubmit = async (data: GoalFormData) => {
    if (editingGoal?.id) {
      await api.put(`/api/goals/${editingGoal.id}`, data);
      toast.success(
        language === "id" ? "Target tabungan berhasil diperbarui" : "Savings goal updated successfully",
      );
    } else {
      await api.post("/api/goals", data);
      toast.success(
        language === "id" ? "Target tabungan berhasil ditambahkan" : "Savings goal added successfully",
      );
    }
    fetchGoals();
    // tidak perlu setIsModalOpen(false) di sini — GoalModal menutup sendiri setelah sukses
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    try {
      await api.delete(`/api/goals/${deletingGoal.id}`);
      toast.success(
        language === "id" ? "Target tabungan berhasil dihapus" : "Savings goal deleted successfully",
      );
      setDeletingGoal(null);
      fetchGoals();
    } catch {
      toast.error(language === "id" ? "Gagal menghapus target" : "Failed to delete goal");
    }
  };

  // Metrics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const averageProgress = goals.length > 0 && totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {language === "id" ? "Target Tabungan" : "Savings Goals"}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {language === "id"
              ? "Kelola rencana dan target finansial masa depan Anda."
              : "Manage and plan your future financial targets."}
          </p>
        </div>
        <Button onClick={openAddModal} className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
          <Plus size={14} strokeWidth={2.5} />
          {language === "id" ? "Tambah Target" : "Add Goal"}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {language === "id" ? "TOTAL TARGET AKUMULATIF" : "TOTAL TARGET AMOUNT"}
          </p>
          <p className="text-lg font-black font-mono tabular-nums text-foreground">
            {formatIDR(totalTarget)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {language === "id" ? "TOTAL TERKUMPUL" : "TOTAL SAVED"}
          </p>
          <p className="text-lg font-black font-mono tabular-nums text-income">
            {formatIDR(totalSaved)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {language === "id" ? "RATA-RATA PROGRES" : "AVERAGE PROGRESS"}
          </p>
          <p className="text-lg font-black font-mono tabular-nums text-accent">
            {averageProgress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-white/[0.01] text-center min-h-[300px]">
          <div className="size-12 rounded-full bg-[#1C2128] border border-border flex items-center justify-center text-muted-foreground/80 mb-4">
            <PiggyBank size={24} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {language === "id" ? "Belum ada target tabungan" : "No savings goals yet"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            {language === "id"
              ? "Tentukan rencana finansial Anda hari ini seperti liburan, dana darurat, atau beli rumah!"
              : "Define your financial targets today like vacations, emergency funds, or buying a house!"}
          </p>
          <Button
            onClick={openAddModal}
            variant="outline"
            className="mt-4 h-8 rounded-lg text-xs font-semibold px-4 border-border bg-elevated hover:bg-[#2D333B]"
          >
            {language === "id" ? "Buat Target Pertama" : "Create First Goal"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div
                key={goal.id}
                className="bg-surface border border-border rounded-xl p-5 hover:border-[#444C56] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Target size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary leading-tight">
                          {goal.name}
                        </h3>
                        {goal.account && (
                          <span className="text-[10px] text-muted-foreground font-medium bg-elevated border border-border px-1.5 py-0.5 rounded mt-1 inline-block">
                            {goal.account.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-expense hover:bg-expense/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {goal.note && (
                    <p className="text-xs text-text-muted mt-3 italic line-clamp-2">"{goal.note}"</p>
                  )}
                </div>

                {/* Progress Section */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs font-mono tabular-nums">
                    <span className="text-text-muted">{formatIDR(goal.currentAmount)}</span>
                    <span className="font-semibold text-text-primary">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#1C2128] border border-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-muted pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {language === "id" ? "Target:" : "Due:"} {formatDate(goal.targetDate, language)}
                    </span>
                    <span className="font-semibold tabular-nums text-text-muted">
                      {language === "id" ? "dari" : "of"} {formatIDR(goal.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal — self-contained, tidak pakai DialogContent lagi */}
      <GoalForm
        open={isModalOpen}
        onClose={closeModal}
        goal={editingGoal ?? undefined}
        accounts={accounts}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog (tetap pakai shadcn Dialog) */}
      <Dialog open={!!deletingGoal} onOpenChange={(open) => !open && setDeletingGoal(null)}>
        <DialogContent className="bg-elevated border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {language === "id" ? "Hapus Target Tabungan?" : "Delete Savings Goal?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === "id"
                ? "Tindakan ini permanen dan tidak dapat dibatalkan."
                : "This action is permanent and cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingGoal(null)}
              className="h-8 rounded-lg text-xs font-semibold"
            >
              {language === "id" ? "Batal" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="bg-expense hover:bg-red-600 text-white h-8 rounded-lg text-xs font-semibold"
            >
              {language === "id" ? "Hapus" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}