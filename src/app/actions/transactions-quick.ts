import { api } from "@/lib/api";
import type { ActionResult } from "@/types";

export async function updateTransactionCategory(
  id: string | number,
  categoryId: string | null
): Promise<ActionResult<null>> {
  try {
    // Fetch current details first
    const current = await api.get<any>(`/api/transactions/${id}`);

    // Perform PUT with updated categoryId
    await api.put(`/api/transactions/${id}`, {
      accountId: current.accountId,
      categoryId: categoryId,
      type: current.type,
      amount: current.amount,
      description: current.description,
      note: current.note,
      date: current.date,
      transferToId: current.transferToId,
    });

    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal memperbarui kategori." };
  }
}
