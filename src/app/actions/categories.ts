import { api } from "@/lib/api";
import { createCategorySchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types";
import { getErrorMessage } from "@/types";

function getString(fd: FormData, name: string): string | undefined {
  const v = fd.get(name);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export async function createCategory(
  _prev: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const parsed = createCategorySchema.safeParse({
    name: getString(formData, "name"),
    type: getString(formData, "type"),
    icon: getString(formData, "icon"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await api.post("/api/categories", {
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon || "📂",
    });
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: getErrorMessage(err, "Gagal membuat kategori baru.") };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  try {
    await api.delete(`/api/categories/${id}`);
    window.dispatchEvent(new CustomEvent("refresh-app-data"));
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: getErrorMessage(err, "Gagal menghapus kategori.") };
  }
}
