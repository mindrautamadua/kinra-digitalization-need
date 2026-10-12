import { requireUser } from "@/lib/auth/guard";
import { PasswordForm } from "./password-form";
import { logoutAction } from "@/actions/auth";
import Link from "next/link";

export const metadata = { title: "Ubah Kata Sandi" };

export default async function PasswordPage() {
  const u = await requireUser();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Ubah Kata Sandi</h1>
          <p className="mt-1 text-sm text-muted">
            {u.mustChangePassword
              ? "Anda wajib mengganti kata sandi awal sebelum melanjutkan."
              : `Akun: ${u.email}`}
          </p>
        </div>
        <PasswordForm />
        <div className="mt-4 flex justify-between text-sm">
          {!u.mustChangePassword && (
            <Link href="/" className="text-primary hover:underline">
              Kembali ke aplikasi
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="text-muted hover:underline">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
