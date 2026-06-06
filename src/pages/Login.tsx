import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Masuk ke Maybe
          </h1>
          <p className="text-sm text-text-muted">
            Selamat datang kembali! Masuk untuk mengelola keuangan Anda.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
