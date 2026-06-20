import { api } from "@/lib/api";
import type { ActionResult } from "@/types";
import { getErrorMessage } from "@/types";
import { invalidateCache } from "@/lib/cache";

interface TransactionDetail {
  accountId: string;
  categoryId: string | null;
  type: string;
  amount: number;
  description: string | null;
  note: string | null;
  date: string;
  transferToId: string | null;
}

export async function updateTransactionCategory(
  id: string,
  categoryId: string | null
): Promise<ActionResult<null>> {
  try {
    // Fetch current details first
    const current = await api.get<TransactionDetail>(`/api/transactions/${id}`);

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

    invalidateCache.afterTransactionChange();
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: getErrorMessage(err, "Gagal memperbarui kategori.") };
  }
}
