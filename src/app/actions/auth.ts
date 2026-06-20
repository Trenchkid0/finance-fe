import { api } from "@/lib/api";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types";
import { getErrorMessage } from "@/types";

export async function login(
  _prevState: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const remember = formData.get("remember") === "true" || formData.get("remember") === "on";

  const parsed = loginSchema.safeParse({ email, password, remember });
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
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err, "Email atau kata sandi salah."),
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
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err, "Gagal mendaftar. Coba lagi."),
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

export async function forgotPassword(
  _prevState: ActionResult<{ resetUrl?: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ resetUrl?: string }>> {
  const email = formData.get("email")?.toString() || "";

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await api.post<{ resetUrl?: string }>("/api/auth/forgot-password", parsed.data);
    return {
      ok: true,
      data: { resetUrl: res.resetUrl },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err, "Email tidak ditemukan atau terjadi kesalahan."),
    };
  }
}

export async function resetPassword(
  _prevState: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const token = formData.get("token")?.toString() || "";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";

  const parsed = resetPasswordSchema.safeParse({ token, email, password });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.post("/api/auth/reset-password", parsed.data);
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err, "Gagal mereset kata sandi. Silakan coba lagi."),
    };
  }
}
