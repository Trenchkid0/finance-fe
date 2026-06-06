import { api } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types";

export async function login(
  _prevState: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.post("/api/auth/login", parsed.data);
    // Successful login -> reload page to let AppLayout context initialize
    window.location.href = "/";
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Email atau kata sandi salah.",
    };
  }
}

export async function register(
  _prevState: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const name = formData.get("name")?.toString() || "";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";

  const parsed = registerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.post("/api/auth/register", parsed.data);
    // Successful registration -> auto login in Go backend (or require manual login)
    // The register Go backend automatically sets cookie and returns user!
    window.location.href = "/";
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Gagal mendaftar. Coba lagi.",
    };
  }
}

export async function logout() {
  try {
    await api.post("/api/auth/logout", {});
  } catch (err) {
    console.error("Logout failed", err);
  } finally {
    window.location.href = "/login";
  }
}
