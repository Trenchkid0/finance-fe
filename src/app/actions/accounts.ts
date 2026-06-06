import { api } from "@/lib/api";
import { createAccountSchema, updateAccountSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types";

export async function createAccount(
  _prev: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const name = formData.get("name")?.toString() || "";
  const type = formData.get("type")?.toString() || "";
  const color = formData.get("color")?.toString() || "";
  const icon = formData.get("icon")?.toString() || "";
  const startingBalance = formData.get("startingBalance")?.toString() || "0";

  const parsed = createAccountSchema.safeParse({
    name: name || undefined,
    type: type || undefined,
    color: color || undefined,
    icon: icon || undefined,
    startingBalance: startingBalance || "0",
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await api.post("/api/accounts", {
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color,
      icon: parsed.data.icon,
      balance: parsed.data.startingBalance,
    });
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal membuat akun." };
  }
}

export async function updateAccount(
  id: string,
  _prev: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const name = formData.get("name")?.toString() || "";
  const type = formData.get("type")?.toString() || "";
  const color = formData.get("color")?.toString() || "";
  const icon = formData.get("icon")?.toString() || "";
  const isActive = formData.get("isActive") === "on";

  const parsed = updateAccountSchema.safeParse({
    name: name || undefined,
    type: type || undefined,
    color: color || undefined,
    icon: icon || undefined,
    isActive,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    // We fetch current balance first to preserve it
    const current = await api.get<any>(`/api/accounts/${id}`);
    await api.put(`/api/accounts/${id}`, {
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color,
      icon: parsed.data.icon,
      isActive: parsed.data.isActive,
      balance: current.balance,
    });
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal memperbarui akun." };
  }
}

export async function toggleAccountActive(id: string): Promise<ActionResult<null>> {
  try {
    const current = await api.get<any>(`/api/accounts/${id}`);
    const nextActive = !current.isActive;
    await api.put(`/api/accounts/${id}`, {
      ...current,
      isActive: nextActive,
    });
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal mengubah status aktif akun." };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult<null>> {
  try {
    await api.delete(`/api/accounts/${id}`);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal menghapus akun." };
  }
}
