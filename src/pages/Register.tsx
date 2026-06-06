import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Daftar akun baru
          </h1>
          <p className="text-sm text-text-muted">
            Mulailah mengelola aset dan melacak pengeluaran Anda.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
