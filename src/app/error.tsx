"use client";
import { Button, LinkButton } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dbIssue = /Failed query|ECONNREFUSED|ENETUNREACH|ETIMEDOUT|connect|terminat/i.test(error.message);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{dbIssue ? "Database tidak dapat dihubungi" : "Terjadi kesalahan"}</h1>
      <p className="max-w-md text-sm text-muted">
        {dbIssue
          ? "Aplikasi tidak dapat terhubung ke server database. Periksa koneksi jaringan ke server KINRA, lalu coba lagi."
          : "Permintaan tidak dapat diproses. Coba lagi; bila berulang, hubungi Administrator TI."}
      </p>
      {error.digest && <p className="text-xs text-muted">Kode: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Coba lagi</Button>
        <LinkButton href="/" variant="outline">
          Beranda
        </LinkButton>
      </div>
    </main>
  );
}
