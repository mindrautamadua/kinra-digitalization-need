import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted">Data yang Anda cari tidak ada atau Anda tidak berhak melihatnya.</p>
      <LinkButton href="/" variant="outline">
        Kembali ke beranda
      </LinkButton>
    </main>
  );
}
