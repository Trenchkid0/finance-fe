import { api } from "@/lib/api";
import type { ActionResult } from "@/types";

export interface ApiKeyListItem {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export async function createApiKey(
  name: string
): Promise<ActionResult<{ id: string; plain: string; prefix: string }>> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { ok: false, fieldErrors: { name: ["Nama kunci wajib diisi"] } };
  }

  try {
    const res = await api.post<any>("/api/api-keys", { name: trimmed });
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return {
      ok: true,
      data: {
        id: res.id,
        plain: res.plainKey,
        prefix: res.keyPrefix,
      },
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal membuat API key." };
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult<null>> {
  try {
    await api.delete(`/api/api-keys/${id}`);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal mencabut API key." };
  }
}

export async function deleteApiKey(id: string): Promise<ActionResult<null>> {
  return revokeApiKey(id); // Revoke is delete in our backend
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  try {
    const rows = await api.get<any[]>("/api/api-keys");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      prefix: r.keyPrefix,
      lastUsedAt: r.lastUsedAt || null,
      revokedAt: r.revokedAt || null,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error("Failed to list API keys", err);
    return [];
  }
}
