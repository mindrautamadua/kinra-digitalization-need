# KINRA Digitalization Needs Assessment (DNA)

Aplikasi web internal PT Kawasan Industri Nusantara (KINRA) untuk mengumpulkan, mereview, mewawancarai, menilai, dan mengekspor kebutuhan digitalisasi dari seluruh Bagian. Dibangun berdasarkan `PRD_KINRA_Digitalization_Needs_Assessment_v1.0.md`.

## Stack

| Lapisan | Pilihan |
| --- | --- |
| Frontend / backend | Next.js 16 (App Router, Server Actions, Route Handlers), TypeScript strict |
| UI | Tailwind CSS v4 + komponen internal bergaya shadcn (`src/components/ui`) |
| Database | PostgreSQL 18 (server KINRA) via Drizzle ORM + migrasi SQL berversi (`drizzle/`) |
| Autentikasi | Email + kata sandi (bcrypt), sesi server-side (tabel `sessions`) dalam cookie `httpOnly` yang ditandatangani (jose) |
| Lampiran | Supabase Storage (bucket privat, fallback disk `STORAGE_DIR`), diunduh hanya lewat `/api/attachments/[id]` setelah pemeriksaan hak akses |
| Ekspor | ExcelJS (XLSX 5 sheet) dan CSV |
| Pengujian | `node:test` via tsx (logika skor, validasi, workflow, aturan unggah) |

## Struktur direktori

```
src/
  app/
    login/                  halaman masuk
    account/password/       ganti kata sandi (wajib saat login pertama)
    (app)/                  area terautentikasi (layout memuat shell + navigasi per role)
      respond/              responden: profil Bagian (Form A), daftar & wizard kebutuhan (Form B)
      needs/                staf/manajemen: register, detail, review (Form C), status, koreksi
      interviews/           interview tracker (Form D)
      dashboard/            dashboard agregat + filter
      admin/                periode, Bagian, pengguna, pengaturan, audit trail
      notifications/        notifikasi dalam aplikasi
    api/attachments/[id]    unduh lampiran privat
    api/export/needs.xlsx   ekspor Excel (Summary, Needs Register, Interview Tracker, Scoring, Master Data)
    api/export/needs.csv    ekspor CSV register
  actions/                  server actions per modul (auth, respond, review, interviews, admin, notifications)
  lib/
    db/schema.ts            skema Drizzle (kamus data)
    auth/                   password, sesi, guard (requireRole / actionRole)
    queries/                query baca per modul
    validation/need.ts      skema zod Form A/B + daftar kolom wajib submit
    scoring.ts              rumus skor berbobot & kategori prioritas
    workflow.ts             transisi status yang diizinkan
    audit.ts, notify.ts, storage.ts, upload-rules.ts, settings.ts, need-code.ts
  proxy.ts                  redirect ke /login bila tidak ada cookie (otorisasi nyata tetap server-side)
drizzle/                    migrasi SQL + snapshot
scripts/seed.ts             seed admin / data demo berlabel [DEMO]
scripts/dev-session.ts      pembuat cookie sesi untuk uji HTTP lokal (bukan untuk production)
tests/                      unit test
```

## Setup lokal

Prasyarat: Node.js 22+, pnpm 10+, akses ke PostgreSQL.

```bash
pnpm install
cp .env.example .env.local        # isi DATABASE_URL, SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY
pnpm db:migrate                   # terapkan migrasi ke database
pnpm seed                         # buat akun admin awal (admin@kinra.local / Admin12345, wajib ganti sandi)
pnpm dev                          # http://localhost:3000
```

Data demo (opsional, semua berlabel `[DEMO]`):

```bash
pnpm seed:demo         # 6 Bagian, reviewer, manajemen, 6 responden, 1 periode aktif, 2 kebutuhan, 1 review
pnpm seed:demo:clean   # hapus seluruh data demo
```

Akun demo (sandi `Demo12345`): `reviewer@kinra.local`, `manajemen@kinra.local`, `kabag.utl@kinra.local`, `kabag.ti@kinra.local`, dst.

## Environment variables

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | `postgresql://user:pass@host:port/db`. Karakter khusus pada kata sandi harus di-URL-encode (`!` menjadi `%21`). |
| `SESSION_SECRET` | ya | Minimal 32 karakter acak. Mengganti nilai ini membatalkan semua sesi. |
| `NEXT_PUBLIC_SUPABASE_URL` | ya* | URL proyek Supabase (`https://<ref>.supabase.co`, lokal `http://127.0.0.1:55321`). |
| `SUPABASE_SERVICE_ROLE_KEY` | ya* | Dipakai server untuk Supabase Storage. Rahasia: jangan diberi prefix `NEXT_PUBLIC_`. *Tanpa URL + key ini, lampiran disimpan ke `STORAGE_DIR`. |
| `SUPABASE_STORAGE_BUCKET` | tidak | Nama bucket privat lampiran. Default `attachments`; dibuat otomatis bila belum ada. |
| `STORAGE_DIR` | tidak | Fallback lampiran di disk bila Supabase Storage tidak dikonfigurasi. Default `./storage`. Tidak persisten di serverless. |
| `MAX_UPLOAD_MB` | tidak | Batas ukuran lampiran. Default 10. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | tidak | Dipakai `pnpm seed`. |

Jangan commit `.env.local`. Jangan pernah mengekspos `DATABASE_URL` ke browser (tidak ada variabel `NEXT_PUBLIC_*` yang memuat rahasia).

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | pengembangan / build produksi / jalankan build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | unit test |
| `pnpm db:generate` | buat migrasi baru dari perubahan `schema.ts` |
| `pnpm db:migrate` | terapkan migrasi yang belum dijalankan |
| `pnpm db:studio` | Drizzle Studio (lokal) |

## Role dan hak akses

| Fitur | Admin TI | Responden | Tim Assessment TI | Manajemen |
| --- | --- | --- | --- | --- |
| Master Bagian / pengguna / periode / pengaturan | kelola | - | - | - |
| Form A & B (profil, kebutuhan) | koreksi administratif (tercatat) | milik Bagian sendiri | koreksi administratif (tercatat) | - |
| Lihat semua kebutuhan | ya | tidak | ya | ya (detail bisa dimatikan di Pengaturan) |
| Form C review, skor, status | ya | lihat status/komentar sendiri | kelola | lihat |
| Interview tracker | ya | ringkasan bila dibagikan | kelola | - |
| Dashboard | ya | - | ya | ya |
| Ekspor | ya | milik sendiri bila diaktifkan | ya | bila detail diaktifkan |
| Audit trail | ya | - | - | - |
| Lampiran | unduh/unggah/arsip | milik sendiri saat masih dapat diedit | unduh/unggah/arsip | unduh bila detail diaktifkan |

Semua pemeriksaan dilakukan server-side (`requireRole` pada page, `actionRole` pada server action, pemeriksaan kepemilikan pada query). `proxy.ts` hanya mempercepat redirect.

## Alur status kebutuhan

`draft → submitted → under_review → {clarification_required | returned_for_revision | interview_scheduled → interview_completed | validated → prioritized | deferred | rejected} → closed`. Daftar transisi yang diizinkan ada di `src/lib/workflow.ts`. Alasan wajib untuk Returned, Clarification Required, Deferred, Rejected. `prioritized` mensyaratkan skor berbobot lengkap. Kebutuhan yang sudah dikirim tidak pernah dihapus; gunakan Arsipkan (status `archived`, alasan wajib, tercatat di audit).

## Skor prioritas

Skor = Σ (nilai kriteria ÷ 5 × bobot), skala 0–100. Bobot default: dampak 30, risiko 25, urgensi 15, strategi 15, kesiapan 10, reuse 5. Ambang default: ≥80 sangat tinggi, ≥65 tinggi, ≥50 menengah. Bobot dan ambang dapat diubah Admin di Pengaturan (total bobot harus 100). Reviewer dapat menandai **risiko kritis** terlepas dari skor. Skor yang sudah tersimpan tidak dihitung ulang otomatis saat bobot berubah; simpan ulang review untuk memperbarui.

## Deployment

1. Siapkan PostgreSQL dan jalankan `pnpm db:migrate` dari mesin yang memiliki akses (atau CI).
2. Set env di server (`DATABASE_URL`, `SESSION_SECRET` acak, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`).
3. `pnpm install --frozen-lockfile && pnpm build && pnpm start -p 3000` di belakang reverse proxy HTTPS (nginx/Caddy). Cookie sesi otomatis `Secure` di production.
4. Pisahkan lingkungan dev / UAT / production (proyek Supabase berbeda).
5. Jalankan `pnpm seed` sekali untuk admin awal, lalu ganti sandinya.

## Backup dan restore

- Database: `pg_dump -Fc "$DATABASE_URL" > kinra-dna-$(date +%F).dump`; restore dengan `pg_restore -d <db-kosong> file.dump`.
- Lampiran: backup bucket Supabase Storage (atau `STORAGE_DIR` bila fallback) bersamaan dengan dump (kunci file tersimpan di tabel `need_attachments.storage_key`).
- Uji restore di lingkungan non-produksi sebelum go-live (acceptance criteria 16).

## Pengujian yang sudah dijalankan

- `pnpm typecheck`, `pnpm lint`, `pnpm build`: lulus.
- `pnpm test`: 12 unit test lulus (rumus skor, kategori, validasi submit, pertanyaan lanjutan, transisi status, aturan unggah).
- Uji HTTP terhadap build produksi dengan sesi tiap role: akses halaman sesuai matriks, responden Bagian lain mendapat 404 pada kebutuhan yang bukan miliknya, responden/manajemen ditolak dari halaman admin dan koreksi, ekspor XLSX/CSV menghormati batasan Bagian, lampiran tanpa sesi tidak dapat diakses.
- Belum diuji otomatis: pengiriman formulir lewat browser (server actions), unggah file nyata, dan restore backup. Lakukan pada UAT.

## Troubleshooting

| Gejala | Penyebab / solusi |
| --- | --- |
| `DATABASE_URL belum diset` | `.env.local` tidak terbaca. Skrip tsx memakai `--env-file=.env.local`. |
| `SESSION_SECRET harus diset` | Isi minimal 32 karakter. |
| Login gagal terus / akun terkunci | 5 kali gagal mengunci 15 menit (`users.locked_until`). Admin dapat mereset sandi dari Pengguna. |
| Lampiran 404 padahal ada di DB | Objek tidak ada di bucket Supabase (beda proyek/bucket), atau file tidak ada di `STORAGE_DIR` saat fallback. |
| Responden tidak melihat formulir | Periode belum `active`, atau Bagian tidak ditetapkan pada periode, atau akun belum terhubung ke Bagian. |
| Ekspor kosong | Filter aktif; register tidak menyertakan draft dan arsip. |

## Keputusan yang diasumsikan (perlu konfirmasi Product Owner)

- Belum ada SSO: autentikasi lokal dengan kebijakan sandi minimal (8 karakter, huruf+angka), kunci sementara setelah 5 kali gagal, wajib ganti sandi awal. MFA belum ada.
- Lampiran disimpan di Supabase Storage (bucket privat, diakses server dengan service role key). Pemindaian malware belum ada; validasi ekstensi, MIME, magic bytes, dan ukuran sudah ada.
- Responden hanya dapat mengubah jawaban setelah dikembalikan atau diminta klarifikasi (bukan bebas setelah submit).
- Manajemen secara default melihat detail kebutuhan; dapat dimatikan di Pengaturan.
- Notifikasi hanya dalam aplikasi; email belum ada.
- Komponen UI dibangun sendiri dengan Tailwind (bukan paket shadcn/ui) agar tanpa dependensi tambahan.
