import { LinkButton } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Akses ditolak</h1>
      <p className="max-w-md text-sm text-muted">Anda tidak memiliki hak untuk membuka halaman ini. Hubungi Administrator TI jika Anda merasa ini keliru.</p>
      <LinkButton href="/" variant="outline">
        Kembali ke beranda
      </LinkButton>
    </main>
  );
}
