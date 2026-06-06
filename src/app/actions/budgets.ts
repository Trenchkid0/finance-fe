import { api } from "@/lib/api";
import type { ActionResult } from "@/types";

export async function setBudgetLimit(
  categoryId: string,
  limit: number
): Promise<ActionResult<null>> {
  if (limit < 0) {
    return { ok: false, error: "Batas anggaran tidak boleh negatif." };
  }

  try {
    if (limit === 0) {
      // Find the budget limit to delete
      const budgets = await api.get<any[]>("/api/budgets");
      const budget = budgets.find((b) => b.categoryId === categoryId);
      if (budget) {
        await api.delete(`/api/budgets/${budget.id}`);
      }
    } else {
      await api.post("/api/budgets", { categoryId, limit });
    }

    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal menyimpan batas anggaran." };
  }
}
