import { api } from "@/lib/api";
import type { ActionResult } from "@/types";
import { cleanMoneyString } from "@/lib/utils/formatters";

function getString(fd: FormData, name: string): string | undefined {
  const v = fd.get(name);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export async function createTransaction(
  _prev: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const rawAmount = getString(formData, "amount") || "0";
  const payload = {
    type: getString(formData, "type"),
    accountId: getString(formData, "accountId"),
    amount: parseFloat(cleanMoneyString(rawAmount)),
    date: getString(formData, "date"),
    description: getString(formData, "description"),
    note: getString(formData, "note") || "",
    categoryId: getString(formData, "categoryId") || null,
    transferToId: getString(formData, "transferToId") || null,
  };
  try {
    await api.post("/api/transactions", payload);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal membuat transaksi." };
  }
}

export async function updateTransaction(
  id: string,
  _prev: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const rawAmount = getString(formData, "amount") || "0";
  const payload = {
    type: getString(formData, "type"),
    accountId: getString(formData, "accountId"),
    amount: parseFloat(cleanMoneyString(rawAmount)),
    date: getString(formData, "date"),
    description: getString(formData, "description"),
    note: getString(formData, "note") || "",
    categoryId: getString(formData, "categoryId") || null,
    transferToId: getString(formData, "transferToId") || null,
  };

  try {
    await api.put(`/api/transactions/${id}`, payload);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal memperbarui transaksi." };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
  try {
    await api.delete(`/api/transactions/${id}`);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal menghapus transaksi." };
  }
}
