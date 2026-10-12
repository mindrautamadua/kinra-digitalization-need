# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## KINRA Digitalization Needs Assessment

**Organisasi:** PT Kawasan Industri Nusantara (KINRA)\
**Versi:** 1.0 --- Draft untuk Pengembangan MVP\
**Status:** Untuk review internal\
**Pemilik Produk:** Bagian Teknologi Informasi dan Manajemen Risiko\
**Pengguna utama:** Kepala Bagian, Tim Assessment TI, Administrator TI,
Manajemen

------------------------------------------------------------------------

## 1. Ringkasan Eksekutif

KINRA Digitalization Needs Assessment adalah aplikasi web internal untuk
mengumpulkan, mengelola, memvalidasi, dan memprioritaskan kebutuhan
digitalisasi dari seluruh Bagian di PT Kawasan Industri Nusantara
(KINRA).

Aplikasi dirancang untuk menjalankan assessment secara bertahap: 1.
Kepala Bagian mengisi formulir digital mengenai proses bisnis,
permasalahan, kebutuhan, manfaat, dan kesiapan. 2. Tim Assessment TI
mengonsolidasikan respons dan memeriksa kualitas informasi. 3. Kebutuhan
yang belum jelas atau berdampak tinggi ditindaklanjuti melalui wawancara
terarah. 4. Kebutuhan yang telah divalidasi disusun menjadi register dan
portofolio inisiatif digitalisasi. 5. Hasilnya menjadi masukan bagi
penyelarasan Rencana Strategis Teknologi Informasi (RSTI) KINRA dan
perencanaan kerja/investasi.

Aplikasi tidak dimaksudkan untuk langsung memutuskan bahwa setiap
kebutuhan harus menjadi aplikasi baru. Solusi dapat berupa
penyederhanaan proses, revisi SOP, otomasi, integrasi, dashboard,
pengembangan aplikasi, atau perubahan organisasi.

## 2. Latar Belakang dan Permasalahan

Kebutuhan digitalisasi tersebar di berbagai fungsi KINRA dan dapat
disampaikan dalam bentuk yang tidak seragam. Tanpa mekanisme
terstruktur, organisasi berisiko: - menerima daftar usulan aplikasi
tanpa memahami akar masalah; - menduplikasi solusi antar-Bagian; - sulit
membandingkan urgensi dan manfaat; - kehilangan informasi mengenai
pemilik proses, data, risiko, biaya, dan ketergantungan; - membangun
solusi yang tidak siap digunakan atau tidak selaras dengan strategi
perusahaan.

Aplikasi ini menyediakan satu mekanisme pengumpulan kebutuhan yang
konsisten dan dapat ditelusuri.

## 3. Tujuan Produk

### 3.1 Tujuan utama

-   Mengumpulkan kebutuhan digitalisasi dari seluruh Bagian dalam format
    standar.
-   Mengidentifikasi masalah proses bisnis sebelum memilih solusi
    teknologi.
-   Mengukur indikasi awal dampak, urgensi, risiko, dan kesiapan.
-   Memudahkan Tim TI menentukan kebutuhan yang memerlukan klarifikasi
    atau wawancara.
-   Menghasilkan register kebutuhan yang dapat diekspor dan dianalisis.
-   Mendukung konsolidasi kebutuhan ke dalam portofolio inisiatif
    digitalisasi dan RSTI.

### 3.2 Indikator keberhasilan MVP

Target awal berikut adalah usulan dan perlu dikonfirmasi oleh pemilik
produk: - 100% Bagian yang ditetapkan memiliki satu akun responden aktif dan masuk dalam daftar assessment. -
Minimal 90% Bagian menyampaikan respons atau status resmi sebelum
tenggat. - 100% kebutuhan yang dikirim memiliki pemilik proses dan
deskripsi masalah. - Seluruh kebutuhan memiliki status tindak lanjut
yang dapat dilacak. - Tim TI dapat mengekspor register kebutuhan ke
Excel. - Tidak ada respons atau lampiran yang dapat diakses oleh
pengguna yang tidak berwenang.

## 4. Prinsip Desain

1.  **Business problem first:** formulir menggali masalah dan hasil yang
    diharapkan sebelum meminta ide solusi.
2.  **Sederhana bagi responden:** bahasa nonteknis, progress indicator,
    autosave atau simpan draft, dan waktu pengisian yang wajar.
3.  **Satu kebutuhan, satu rekaman:** satu Bagian dapat mengirim banyak
    kebutuhan; setiap kebutuhan dinilai dan dilacak secara independen.
4.  **Human-in-the-loop:** skor dan rekomendasi sistem merupakan
    indikasi awal, bukan keputusan investasi otomatis.
5.  **Evidence-based:** responden dapat menyertakan contoh dokumen atau
    data pendukung.
6.  **Secure by default:** akses berdasarkan peran, lampiran privat,
    audit trail, dan minimisasi data pribadi.
7.  **No technology for technology's sake:** perubahan proses atau SOP
    dapat menjadi rekomendasi yang valid tanpa membangun aplikasi baru.
8.  **MVP first:** hindari fitur kompleks yang tidak dibutuhkan untuk
    mengumpulkan dan memvalidasi kebutuhan.

## 5. Ruang Lingkup

### 5.1 Termasuk dalam MVP

-   Login dan kontrol akses berbasis peran.
-   Master Bagian dan pengguna.
-   Periode assessment.
-   Formulir profil Bagian dan formulir kebutuhan digitalisasi.
-   Simpan draft, edit, submit, dan pengembalian untuk perbaikan.
-   Pengajuan beberapa kebutuhan dari satu Bagian.
-   Unggah bukti pendukung dengan akses privat.
-   Review, komentar, permintaan klarifikasi, dan status kebutuhan.
-   Penilaian awal dan alasan penilaian.
-   Interview tracker dan catatan wawancara.
-   Dashboard respons dan register kebutuhan.
-   Pencarian, filter, sortir, dan ekspor Excel/CSV.
-   Audit trail aktivitas penting.
-   Konfigurasi master kategori, urgensi, dan parameter assessment oleh
    Administrator.

### 5.2 Tidak termasuk dalam MVP

-   Pengadaan, persetujuan anggaran, atau manajemen proyek implementasi.
-   Integrasi otomatis dengan seluruh sistem perusahaan.
-   AI yang secara otomatis memutuskan prioritas atau menyetujui
    kebutuhan.
-   Penyusunan business case finansial secara otomatis.
-   Manajemen kontrak/vendor dan procurement.
-   Manajemen risiko korporat secara penuh.
-   Pengukuran IT maturity/COBIT secara penuh.
-   Portal eksternal untuk tenant/investor.
-   Aplikasi mobile native.
-   Workflow tanda tangan elektronik formal.

Fitur di luar ruang lingkup dapat dipertimbangkan pada fase berikutnya
berdasarkan kebutuhan nyata.

## 6. Pengguna dan Hak Akses

### 6.1 Role

**A. Administrator TI** - Mengelola pengguna, role, master Bagian,
periode assessment, kategori, dan konfigurasi. - Melihat dan mengelola
seluruh data assessment. - Melihat audit trail. - Tidak boleh mengubah
catatan historis secara diam-diam; perubahan penting harus tercatat.

**B. Kepala Bagian / Responden** - Melihat periode assessment yang
aktif. - Mengisi profil Bagian dan kebutuhan. - Menyimpan draft,
mengirim, dan memperbaiki respons yang dikembalikan. - Melihat status
serta komentar untuk respons milik Bagian sendiri. - Tidak dapat melihat
respons Bagian lain kecuali diberikan hak khusus.

**C. Tim Assessment TI** - Melihat seluruh respons yang menjadi lingkup
assessment. - Memeriksa kelengkapan dan meminta klarifikasi. -
Memberikan skor awal beserta alasan. - Membuat agenda wawancara dan
mencatat hasil. - Mengubah status sesuai workflow. - Menyusun
rekomendasi awal.

**D. Manajemen / Reviewer** - Melihat dashboard, ringkasan, register,
dan hasil prioritisasi sesuai kewenangan. - Memberi komentar atau arahan
jika diaktifkan. - Tidak otomatis memiliki hak mengubah jawaban
responden.

### 6.2 Matriks akses ringkas

  ------------------------------------------------------------------------------------
  Fitur/Data        Admin TI         Responden         Tim Assessment  Manajemen
                                                       TI              
  ----------------- ---------------- ----------------- --------------- ---------------
  Master            Kelola           Lihat milik       Lihat           Lihat ringkasan
  pengguna/Bagian                    sendiri                           

  Buat/edit         Semua untuk      Milik Bagian      Koreksi         Tidak
  kebutuhan         dukungan         sendiri           administratif   
                    administratif,                     dengan audit    
                    tercatat                                           

  Lihat semua       Ya               Tidak             Ya              Sesuai
  kebutuhan                                                            kewenangan

  Skor dan status   Ya               Lihat             Kelola          Lihat
  assessment                         status/komentar                   
                                     milik sendiri                     

  Catatan wawancara Ya               Hanya bagian yang Kelola          Sesuai
                                     relevan bila                      kewenangan
                                     dibagikan                         

  Dashboard agregat Ya               Opsional          Ya              Ya
                                     ringkasan milik                   
                                     sendiri                           

  Ekspor data       Ya               Tidak, kecuali    Ya              Sesuai
                                     milik sendiri                     kewenangan
                                     jika diaktifkan                   

  Audit trail       Ya               Tidak             Akses terbatas  Tidak/summary
  ------------------------------------------------------------------------------------

Akses final perlu dikonfirmasi sebelum implementasi. Sistem harus
menggunakan prinsip least privilege.

## 7. Alur Bisnis dan Status

### 7.1 Alur utama

1.  Administrator membuat periode assessment, menetapkan tenggat, dan
    mengaktifkan daftar Bagian.
2.  Responden masuk ke aplikasi dan melengkapi profil Bagian.
3.  Responden menambahkan satu atau lebih kebutuhan digitalisasi.
4.  Responden menyimpan draft atau mengirim kebutuhan.
5.  Sistem memvalidasi kolom wajib.
6.  Tim Assessment TI melakukan review.
7.  Tim TI menerima, meminta klarifikasi, atau menandai kebutuhan untuk
    perhatian segera.
8.  Jika perlu, Tim TI membuat sesi wawancara dan mencatat hasilnya.
9.  Tim TI memperbarui skor, kategori solusi, dan rekomendasi.
10. Kebutuhan yang siap dianalisis masuk ke register dan ekspor
    portofolio.

### 7.2 Status yang disarankan

-   **Draft** --- belum dikirim.
-   **Submitted** --- dikirim oleh responden.
-   **Under Review** --- sedang ditelaah.
-   **Clarification Required** --- memerlukan informasi tambahan.
-   **Interview Scheduled** --- wawancara dijadwalkan.
-   **Interview Completed** --- wawancara selesai, hasil
    perlu/finalisasi review.
-   **Validated** --- informasi dianggap cukup untuk penilaian.
-   **Prioritized** --- sudah dinilai dan ditempatkan dalam urutan
    prioritas.
-   **Deferred** --- ditunda dengan alasan.
-   **Rejected / Not Pursued** --- tidak dilanjutkan, wajib mencatat
    alasan.
-   **Returned for Revision** --- dikembalikan kepada responden.
-   **Closed** --- proses assessment selesai.

Status "Prioritized" tidak berarti anggaran atau implementasi sudah
disetujui.

## 8. Struktur Formulir Assessment

Formulir menggunakan wizard bertahap dengan progress indicator.
Tampilkan pertanyaan lanjutan berdasarkan jawaban sebelumnya jika
relevan.

### 8.1 Form A --- Profil Bagian

1.  Periode assessment (otomatis).
2.  Nama Bagian (master, wajib).
3.  Nama responden (otomatis dari akun jika tersedia).
4.  Jabatan responden (wajib).
5.  Nama pejabat/pemilik proses (wajib, dapat sama dengan responden).
6.  Jumlah perkiraan pengguna yang terlibat (rentang angka).
7.  Proses utama Bagian (teks, wajib).
8.  Layanan utama yang diberikan dan penerimanya (teks).
9.  Sistem/aplikasi yang digunakan saat ini (teks atau pilihan
    multi-select).
10. Cara kerja yang dominan: aplikasi terintegrasi, aplikasi terpisah,
    spreadsheet, dokumen/manual, kombinasi.
11. Pernyataan bahwa informasi yang dikirim telah ditinjau secara wajar
    oleh Bagian.

### 8.2 Form B --- Satu Rekaman Kebutuhan Digitalisasi

Setiap Bagian dapat menambahkan beberapa kebutuhan. Kolom wajib diberi
tanda yang jelas.

**Identitas dan konteks** 1. Judul kebutuhan (wajib, ringkas). 2. Proses
bisnis terkait (wajib). 3. Pemilik proses (wajib). 4. Pihak
terdampak/pengguna (multi-select: internal, tenant, investor, vendor,
regulator, masyarakat/lingkungan, lainnya). 5. Frekuensi proses (harian,
mingguan, bulanan, tahunan, ad hoc, real-time). 6. Perkiraan volume
(angka atau rentang, opsional jika belum diketahui).

**Masalah saat ini** 7. Apa masalah yang terjadi? (wajib, teks panjang).
8. Bagaimana proses dilakukan saat ini? (wajib, teks). 9. Dampak masalah
(multi-select: waktu, biaya, pendapatan, layanan tenant/investor,
kualitas data, risiko/kepatuhan, keselamatan/lingkungan, kontrol/audit,
keputusan manajemen, lainnya). 10. Seberapa sering masalah terjadi?
(jarang, bulanan, mingguan, harian, hampir setiap transaksi). 11. Apa
dampaknya jika masalah tidak ditangani? (wajib). 12. Apakah ada contoh
atau bukti pendukung? (ya/tidak/belum tersedia). Jika ada, unggah file
opsional.

**Kebutuhan dan solusi** 13. Perubahan atau hasil apa yang ingin
dicapai? (wajib). 14. Usulan solusi (opsional; aplikasi, otomasi,
integrasi, dashboard/analitik, mobile, IoT/sensor, perbaikan SOP,
pelatihan, belum tahu, lainnya). 15. Apakah kebutuhan ini terkait dengan
sistem yang sudah ada? (ya/tidak/tidak tahu). Jika ya, jelaskan. 16.
Data yang diperlukan atau dihasilkan (teks). 17. Apakah diperlukan
pertukaran data dengan Bagian/sistem lain? (ya/tidak/tidak tahu). Jika
ya, sebutkan. 18. Apakah terdapat data sensitif/pribadi/rahasia atau
data kritis? (ya/tidak/tidak tahu; jelaskan jenisnya tanpa mengunggah
data sensitif yang tidak diperlukan). 19. Apakah proses memerlukan akses
dari lapangan/perangkat mobile? (ya/tidak/tidak tahu). 20. Apakah
kebutuhan berkaitan dengan tenant, investor, utilitas, kawasan, aset,
atau infrastruktur? (pilihan multi-select).

**Manfaat, urgensi, dan kesiapan** 21. Manfaat yang diharapkan
(multi-select: mengurangi waktu, mengurangi biaya, meningkatkan
pendapatan/penagihan, meningkatkan layanan, memperkuat
kontrol/kepatuhan, mengurangi risiko, meningkatkan kualitas data,
meningkatkan keselamatan/lingkungan, mempercepat keputusan, lainnya).
22. Baseline atau kondisi saat ini (angka jika diketahui; contoh waktu
proses, jumlah kesalahan, tunggakan, atau jumlah laporan manual). 23.
Target yang diharapkan (angka jika diketahui; opsional). 24. Urgensi
menurut Bagian (rendah, sedang, tinggi, kritis). 25. Alasan urgensi
(wajib). 26. Tenggat eksternal atau ketergantungan waktu (opsional). 27.
Kesiapan data (siap, sebagian, belum, tidak tahu). 28. Kesiapan
proses/SOP (terdefinisi, sebagian, belum, tidak tahu). 29. Ketersediaan
pemilik proses untuk terlibat (siap, terbatas, belum ditetapkan). 30.
Ketergantungan kepada Bagian atau pihak lain (teks). 31. Perkiraan biaya
jika diketahui (opsional; jangan memaksa responden membuat estimasi
teknis). 32. Lampiran pendukung (opsional, file privat). 33. Catatan
tambahan (opsional).

### 8.3 Form C --- Review Tim Assessment TI

Hanya dapat diakses Tim Assessment TI dan Administrator yang
berwenang: - Kelengkapan informasi: lengkap / perlu klarifikasi. - Akar
masalah teridentifikasi: ya / sebagian / belum. - Duplikasi dengan
kebutuhan lain: tidak / mungkin / ya, referensi kebutuhan terkait. -
Kategori solusi awal: process/SOP, configuration, integration,
automation, reporting/BI, new application, infrastructure/IoT, data
governance, security/risk, training/change, defer/no technology. -
Kesesuaian dengan strategi/RSTI: jelas / sebagian / belum dinilai. -
Risiko jika ditunda: rendah / sedang / tinggi / kritis, dengan alasan. -
Rekomendasi tindak lanjut: tanpa wawancara / wawancara / bukti tambahan
/ workshop lintas Bagian. - Catatan reviewer dan daftar pertanyaan
klarifikasi.

### 8.4 Form D --- Interview Tracker

-   ID kebutuhan terkait (wajib).
-   Tujuan wawancara.
-   Tanggal dan waktu.
-   Peserta dan pemilik proses.
-   Pertanyaan klarifikasi.
-   Temuan dan bukti.
-   Proses saat ini dan target.
-   Volume/frekuensi/baseline terverifikasi.
-   Ketergantungan dan risiko.
-   Keputusan tindak lanjut.
-   Penanggung jawab dan tenggat.
-   Status: direncanakan / dijadwalkan / selesai / perlu tindak lanjut.
-   Lampiran/notulen opsional.

## 9. Penilaian dan Prioritisasi

### 9.1 Prinsip

Skor adalah alat bantu untuk membandingkan kebutuhan, bukan pengganti
keputusan manajemen. Pisahkan **urgensi yang dilaporkan Bagian** dari
**prioritas yang ditetapkan setelah validasi**.

### 9.2 Skor prioritas awal

Gunakan skala 1--5 dengan kriteria yang ditampilkan di UI. Skor awal
yang diusulkan: - Dampak bisnis/layanan: 30%. - Risiko, kepatuhan,
keselamatan, atau kontinuitas: 25%. - Urgensi/tenggat: 15%. - Kesesuaian
dengan strategi/RSTI: 15%. - Kesiapan proses, data, dan pemilik: 10%. -
Potensi reuse/integrasi lintas Bagian: 5%.

Rumus: skor berbobot = jumlah (nilai kriteria ÷ 5 × bobot). Hasil
0--100. Kesiapan diberi nilai tinggi bila siap, sehingga kebutuhan
dengan nilai manfaat tinggi tetapi kesiapan rendah dapat diprioritaskan
sebagai discovery/foundation, bukan otomatis langsung diimplementasikan.

Kategori indikatif: - 80--100: prioritas sangat tinggi, wajib
divalidasi. - 65--79: prioritas tinggi. - 50--64: prioritas menengah. -
Di bawah 50: prioritas rendah atau perlu dirumuskan ulang.

**Override risiko kritis:** kebutuhan terkait potensi keselamatan,
keamanan siber, kewajiban hukum, gangguan layanan esensial, atau
kehilangan pendapatan yang material harus ditandai untuk penilaian
segera oleh reviewer, terlepas dari skor total. Jangan menyamakan skor
tinggi dengan persetujuan investasi.

## 10. Dashboard dan Laporan

### 10.1 Dashboard utama

Tampilkan: - Jumlah Bagian yang ditetapkan, sudah mengisi, belum
mengisi. - Tingkat respons (%). - Jumlah kebutuhan menurut status. -
Kebutuhan per Bagian. - Distribusi kategori masalah dan manfaat. -
Distribusi urgensi responden vs prioritas reviewer. - Kebutuhan yang
memerlukan wawancara. - Kebutuhan dengan indikasi risiko kritis. -
Kebutuhan per kategori solusi. - Tren respons menurut periode, jika ada
beberapa periode.

### 10.2 Filter

-   Periode assessment.
-   Bagian.
-   Status.
-   Urgensi.
-   Kategori dampak.
-   Kategori solusi.
-   Kebutuhan wawancara.
-   Prioritas reviewer.

### 10.3 Ekspor

-   Excel (.xlsx) dengan sheet: Summary, Needs Register, Interview
    Tracker, Scoring, Master Data.
-   CSV untuk register kebutuhan.
-   Cetak/ekspor ringkasan PDF dapat dipertimbangkan; bukan blocker MVP.
-   Ekspor harus menghormati hak akses dan dicatat di audit trail untuk
    data sensitif.

### 10.4 Kolom utama Needs Register

-   Assessment ID.
-   Need ID.
-   Bagian.
-   Judul kebutuhan.
-   Proses.
-   Masalah utama.
-   Dampak.
-   Urgensi responden.
-   Kategori solusi awal.
-   Status review.
-   Perlu wawancara.
-   Skor prioritas.
-   Pemilik proses.
-   Reviewer.
-   Tanggal submit.
-   Tanggal update terakhir.
-   Rekomendasi tindak lanjut.
-   Tautan ke detail kebutuhan.

## 11. Kebutuhan Fungsional

**FR-01 --- Authentication:** pengguna harus login sebelum mengakses
aplikasi.\
**FR-02 --- Authorization:** sistem memeriksa role dan kepemilikan
Bagian pada setiap operasi server-side.\
**FR-03 --- Master data:** admin dapat mengelola Bagian, pengguna, role,
periode, kategori, dan tenggat.\
**FR-04 --- Draft:** responden dapat menyimpan draft dan melanjutkan
kemudian.\
**FR-05 --- Multiple needs:** responden dapat membuat lebih dari satu
kebutuhan per periode.\
**FR-06 --- Validation:** sistem memvalidasi field wajib, panjang input,
tipe file, dan ukuran file.\
**FR-07 --- Submission:** pengiriman mengunci versi respons; perubahan
setelah submit harus melalui workflow revisi atau dikembalikan.\
**FR-08 --- Review:** Tim TI dapat memberi komentar, meminta
klarifikasi, mengubah status, dan mencatat alasan.\
**FR-09 --- Scoring:** reviewer mengisi nilai dan alasan; sistem
menghitung skor berbobot secara konsisten.\
**FR-10 --- Interview:** pengguna berwenang dapat membuat dan
memperbarui catatan wawancara terkait Need ID.\
**FR-11 --- Dashboard:** sistem menghitung agregat berdasarkan data
tersimpan dan filter aktif.\
**FR-12 --- Search/filter:** register dapat dicari dan difilter.\
**FR-13 --- Export:** pengguna berwenang dapat mengekspor register dan
ringkasan.\
**FR-14 --- Evidence upload:** lampiran tersimpan privat dan hanya dapat
diakses oleh role yang berwenang.\
**FR-15 --- Audit trail:** perubahan status, skor, role, master data,
ekspor, dan akses administratif penting tercatat.\
**FR-16 --- Notifications:** tampilkan notifikasi dalam aplikasi untuk
status, permintaan klarifikasi, dan tenggat. Email bersifat opsional
sesuai fasilitas yang tersedia.\
**FR-17 --- Period management:** assessment memiliki periode, tanggal
mulai/tenggat, status aktif/ditutup.\
**FR-18 --- No destructive deletion:** kebutuhan yang telah dikirim
tidak dapat dihapus permanen melalui UI normal; gunakan status
arsip/void dengan alasan dan audit trail.

## 12. Model Data Minimum

Gunakan UUID sebagai primary key, timestamp, dan foreign key yang
konsisten.

### 12.1 Tabel

1.  `profiles`: user_id, full_name, email, job_title, department_id,
    is_active, created_at, updated_at.
2.  `departments`: id, code, name, description, head_user_id, is_active.
3.  `roles` atau role enum terkontrol: admin, respondent,
    assessment_reviewer, management_viewer.
4.  `assessment_periods`: id, name, description, start_at, due_at,
    status, created_by, created_at.
5.  `department_submissions`: id, period_id, department_id,
    respondent_id, status, submitted_at, reviewed_at, created_at,
    updated_at.
6.  `digital_needs`: id, submission_id, need_code, title,
    business_process, process_owner, affected_parties, frequency,
    estimated_volume, problem_description, current_process, impacts,
    problem_frequency, consequence_if_unresolved, evidence_available,
    desired_outcome, proposed_solution, existing_system_relation,
    data_required, integration_required, sensitive_data_flag,
    mobile_field_need, domain_tags, expected_benefits, baseline, target,
    respondent_urgency, urgency_reason, external_deadline,
    data_readiness, process_readiness, owner_readiness, dependencies,
    estimated_cost, additional_notes, status, created_at, updated_at.
7.  `need_attachments`: id, need_id, storage_key, original_filename,
    mime_type, size_bytes, uploaded_by, created_at.
8.  `need_reviews`: id, need_id, reviewer_id, completeness,
    root_cause_status, duplicate_status, related_need_ids,
    solution_category, strategic_alignment, delay_risk,
    follow_up_recommendation, reviewer_notes, scores_json atau kolom
    skor terpisah, weighted_score, reviewed_at.
9.  `clarification_threads`: id, need_id, author_id, message,
    visibility, created_at.
10. `interviews`: id, need_id, objective, scheduled_at, participants,
    questions, findings, verified_baseline, dependencies_risks, outcome,
    owner_user_id, due_at, status, notes, created_at, updated_at.
11. `audit_logs`: id, actor_user_id, action, entity_type, entity_id,
    before_json, after_json, created_at, request metadata yang aman.
12. `app_settings`: key, value_json, updated_by, updated_at.

Model dapat dinormalisasi lebih lanjut. Hindari menyimpan semua
kebutuhan dalam satu kolom JSON besar; gunakan kolom terstruktur untuk
data yang akan difilter dan dianalisis. `scores_json` hanya boleh
digunakan bila implementasi skor memang dinamis; jika kriterianya tetap,
gunakan kolom terpisah.

### 12.2 Aturan data

-   Satu `department_submission` per Bagian per periode, tetapi memiliki
    banyak `digital_needs`.
-   Setiap kebutuhan memiliki kode yang mudah dibaca, misalnya
    `DNA-2026-0001`; kode tidak boleh menjadi satu-satunya primary key.
-   Gunakan soft archive untuk data yang perlu dipertahankan.
-   Gunakan foreign key, index untuk filter umum, dan validasi
    server-side.
-   Jangan menyimpan kata sandi dalam tabel aplikasi jika autentikasi
    ditangani provider identitas.

## 13. Rekomendasi Arsitektur Teknis

### 13.1 Stack

-   Frontend: Next.js App Router + TypeScript strict mode.
-   UI: Tailwind CSS + shadcn/ui.
-   Backend: Next.js server-side routes/server actions yang tervalidasi;
    modular monolith untuk MVP.
-   Database: PostgreSQL.
-   Authentication: provider identitas yang disetujui KINRA; bila belum
    ada, gunakan mekanisme autentikasi yang aman dan dapat dipelihara.
-   File storage: private object storage dengan signed URL berumur
    pendek atau mekanisme akses server-side.
-   Export: library yang sesuai untuk XLSX/CSV.
-   Observability: structured logging, error monitoring, health checks,
    dan backup monitoring.

### 13.2 Prinsip arsitektur

-   Tidak memerlukan microservices untuk MVP.
-   Pisahkan domain/module: identity, assessment, review, interview,
    reporting, administration.
-   Seluruh validasi otorisasi dilakukan server-side; jangan
    mengandalkan penyembunyian tombol di frontend.
-   Jika memakai Supabase/PostgreSQL, aktifkan Row Level Security bila
    sesuai arsitektur, dan jangan pernah mengekspos service-role key ke
    browser.
-   Simpan secrets di environment variables/secret manager, bukan di
    repository.
-   Pisahkan development, staging/UAT, dan production.
-   Gunakan database migration versioned dan pipeline deployment yang
    dapat diulang.
-   Data produksi tidak boleh disalin ke development tanpa masking dan
    persetujuan.
-   Hosting dan lokasi data harus disetujui KINRA sesuai kebijakan
    keamanan dan data residency.

## 14. Non-Functional Requirements

### 14.1 Security

-   TLS/HTTPS untuk semua trafik.
-   RBAC dan pemeriksaan kepemilikan data pada setiap request.
-   MFA untuk administrator/reviewer jika fasilitas tersedia.
-   Lampiran privat; validasi ekstensi, MIME type, ukuran, dan malware
    scanning bila tersedia.
-   Proteksi terhadap injection, XSS, CSRF sesuai pola framework,
    brute-force, dan session hijacking.
-   Session expiration dan logout yang aman.
-   Secrets tidak masuk ke log atau browser.
-   Audit log tidak dapat diedit oleh pengguna biasa.
-   Data pribadi dibatasi pada yang diperlukan untuk assessment.

### 14.2 Privacy dan data governance

-   Jangan meminta atau mengunggah data pribadi tenant/karyawan yang
    tidak diperlukan.
-   Instruksikan responden untuk menyamarkan data sensitif pada bukti
    pendukung.
-   Tetapkan retensi data, pemilik data, dan prosedur penghapusan/arsip
    sebelum production.
-   Hak akses terhadap catatan wawancara dapat dibatasi jika memuat
    informasi sensitif.
-   Terapkan kebijakan klasifikasi informasi KINRA yang berlaku.

### 14.3 Performance dan availability

Target awal untuk MVP, perlu dikonfirmasi: - 95% halaman umum selesai
dimuat dalam ≤3 detik pada kondisi jaringan kantor yang wajar, tidak
termasuk ekspor besar. - Operasi simpan/submit normal selesai dalam ≤2
detik pada beban yang disepakati. - Mendukung minimal 100 akun terdaftar
dan 50 pengguna bersamaan sebagai target desain awal, bukan hasil
pengujian. - Availability target 99,5% per bulan sebagai target awal
jika lingkungan hosting mendukung. - Pagination untuk register; jangan
memuat semua rekaman sekaligus. - Ekspor besar dijalankan dengan batas
ukuran atau proses background bila dibutuhkan.

### 14.4 Usability dan accessibility

-   Bahasa antarmuka utama Bahasa Indonesia.
-   Responsive untuk desktop, tablet, dan mobile browser.
-   Formulir bertahap, progress indicator, label yang jelas, contoh
    jawaban, dan pesan error yang spesifik.
-   Kontras, fokus keyboard, label input, dan navigasi yang wajar.
-   Jangan menghapus input responden karena sesi habis atau validasi
    gagal; sediakan draft yang aman.
-   Target pengisian satu kebutuhan: sekitar 10--15 menit, bergantung
    kompleksitas.

### 14.5 Maintainability

-   TypeScript strict mode.
-   Linting, formatting, dan automated tests.
-   Dokumentasi setup, environment variables, deployment,
    backup/restore, role matrix, data dictionary, dan runbook.
-   Seluruh source code berada pada repository yang
    dimiliki/dikendalikan KINRA.
-   Hindari ketergantungan pada satu developer atau akun personal.

## 15. Keamanan dan Audit

Audit trail minimal mencatat: - login administratif dan perubahan
role; - pembuatan/penutupan periode; - submit, pengembalian, perubahan
status, dan pengarsipan kebutuhan; - perubahan skor dan alasan; -
perubahan master data; - unggah/hapus/arsip lampiran; - ekspor data; -
tindakan administratif terhadap akun.

Jangan menyimpan password, token, isi rahasia, atau data sensitif yang
tidak diperlukan di log. Tentukan retensi log sesuai kebijakan KINRA.

## 16. Acceptance Criteria

MVP dinyatakan memenuhi kebutuhan bila seluruh kriteria berikut lulus
UAT:

1.  Pengguna yang belum login tidak dapat melihat data assessment.
2.  Responden hanya dapat melihat dan mengubah respons yang menjadi
    haknya.
3.  Satu Bagian dapat mengirim beberapa kebutuhan pada periode yang
    sama.
4.  Draft dapat disimpan dan dilanjutkan kembali.
5.  Sistem menolak submit jika field wajib belum lengkap dan menunjukkan
    kesalahan secara jelas.
6.  Setelah submit, perubahan mengikuti workflow revisi/return dan
    terekam di audit trail.
7.  Reviewer dapat meminta klarifikasi dan responden dapat menjawabnya.
8.  Reviewer dapat membuat wawancara yang terhubung ke kebutuhan
    tertentu.
9.  Skor berbobot dihitung sesuai formula dan tampilkan rincian nilai
    setiap kriteria.
10. Kebutuhan berisiko kritis dapat ditandai untuk review segera, tanpa
    mengandalkan skor total saja.
11. Dashboard menampilkan jumlah dan status yang sesuai dengan data
    register.
12. Filter dan pencarian menghasilkan data yang benar.
13. Ekspor XLSX berisi kolom yang disepakati dan menghormati hak akses.
14. Lampiran tidak dapat diakses melalui URL publik yang tidak
    terlindungi.
15. Aktivitas penting tercatat di audit trail.
16. Backup dapat dibuat dan prosedur restore telah diuji di lingkungan
    nonproduksi.
17. Aplikasi diuji pada desktop dan mobile browser.
18. Tidak ada defect keamanan kritis/tinggi yang belum ditangani sebelum
    go-live.
19. KINRA menerima source code, dokumentasi, database schema, migration,
    test result, dan runbook.
20. Pemilik produk menyetujui hasil UAT dan prosedur operasional.

## 17. Test Scenarios Minimum

-   Responden mengisi satu kebutuhan lengkap dan submit.
-   Responden membuat tiga kebutuhan berbeda pada satu periode.
-   Responden menyimpan draft, logout, login kembali, lalu melanjutkan.
-   Responden mencoba mengakses kebutuhan Bagian lain melalui perubahan
    URL/ID.
-   Reviewer meminta klarifikasi dan responden memperbaiki respons.
-   Reviewer menandai kebutuhan berisiko kritis.
-   Reviewer membuat dan menyelesaikan wawancara.
-   Perubahan skor menghitung ulang nilai prioritas dengan benar.
-   Admin menutup periode dan pengguna tidak dapat submit baru tanpa
    izin.
-   Lampiran dengan ekstensi/MIME type berbahaya ditolak.
-   Pengguna tidak berwenang mencoba mengunduh lampiran.
-   Ekspor register sesuai filter aktif.
-   Audit log mencatat perubahan status dan skor.
-   Backup database dan lampiran dipulihkan pada lingkungan uji.

## 18. Tahapan Implementasi

Estimasi indikatif; jadwal aktual bergantung pada kesiapan akses,
infrastruktur, dan tim.

**Sprint 0 --- Konfirmasi kebutuhan** - Konfirmasi struktur Bagian,
daftar pengguna, SSO, hosting, klasifikasi data, tenggat assessment, dan
owner. - Finalisasi pertanyaan, status, role matrix, serta rubric
scoring.

**Sprint 1 --- Foundation** - Setup repository, environment, database
migrations, authentication, RBAC, master Bagian, dan periode assessment.

**Sprint 2 --- Assessment form** - Profil Bagian, kebutuhan
multi-record, draft, validasi, submit, dan upload bukti.

**Sprint 3 --- Review & interview** - Review queue, klarifikasi, status
workflow, skor, dan interview tracker.

**Sprint 4 --- Dashboard & export** - Dashboard, filter, Needs Register,
dan ekspor XLSX/CSV.

**Sprint 5 --- Security, UAT & deployment** - Pengujian akses, audit,
backup/restore, perbaikan defect, dokumentasi, pelatihan singkat, dan
go-live.

Estimasi awal sekitar 4--6 minggu untuk MVP dengan tim kecil yang
kompeten; ini bukan komitmen jadwal dan perlu divalidasi oleh tim
implementasi.

## 19. Risiko dan Mitigasi

  -----------------------------------------------------------------------
  Risiko                              Mitigasi
  ----------------------------------- -----------------------------------
  Responden mengusulkan aplikasi      Wajibkan masalah, proses saat ini,
  tanpa menjelaskan masalah           dampak, dan hasil yang diharapkan

  Form terlalu panjang sehingga       Wizard bertahap, field kondisional,
  respons rendah                      simpan draft, dan target waktu
                                      pengisian

  Data kebutuhan tidak konsisten      Master data, panduan jawaban,
                                      validasi, dan review TI

  Prioritas hanya mengikuti           Pisahkan urgensi responden dari
  preferensi Bagian                   skor reviewer dan gunakan kriteria
                                      transparan

  Duplikasi usulan                    Search dan review kebutuhan lintas
                                      Bagian

  Informasi sensitif terunggah        Peringatan, akses privat,
                                      minimisasi data, dan retensi

  Aplikasi menjadi proyek terlalu     Batasi MVP pada assessment, review,
  besar                               wawancara, dashboard, dan ekspor

  Ketergantungan pada developer       Repository milik KINRA,
  tertentu                            dokumentasi, migration, tests, dan
                                      runbook

  Data tidak ditindaklanjuti          Tetapkan owner, tenggat assessment,
                                      status, dan forum review berkala
  -----------------------------------------------------------------------

## 20. Asumsi dan Keputusan yang Harus Dikonfirmasi

Sebelum pengembangan dimulai, Product Owner perlu menetapkan: 1. Daftar
resmi Bagian dan pejabat yang menjadi responden. 2. Apakah tersedia
SSO/identity provider perusahaan. 3. Infrastruktur hosting dan database
yang disetujui. 4. Kebijakan klasifikasi, retensi, dan penyimpanan
dokumen. 5. Tanggal mulai dan tenggat pengisian. 6. Apakah responden
boleh memperbarui jawaban setelah submit atau hanya setelah
dikembalikan. 7. Bobot prioritas dan ambang kategori yang akan dipakai.
8. Apakah Manajemen melihat semua detail atau hanya dashboard dan
kebutuhan terpilih. 9. Apakah email notification dibutuhkan pada MVP.
10. Format ekspor yang wajib. 11. Target kinerja, availability, dan
volume pengguna final. 12. Penanggung jawab operasional aplikasi setelah
go-live.

Asumsi yang belum dikonfirmasi tidak boleh dianggap sebagai kebijakan
resmi KINRA.

## 21. Instruksi Implementasi untuk AI Agent

Bangun aplikasi berdasarkan PRD ini dengan urutan: 1. Periksa repository
dan lingkungan yang tersedia sebelum mengubah apa pun. 2. Buat
implementation plan dan daftar file/modul. 3. Implementasikan schema dan
migrations sebelum fitur yang bergantung pada data. 4. Implementasikan
authentication dan authorization server-side sebelum dashboard atau
form. 5. Buat fitur end-to-end secara bertahap; jangan hanya
menghasilkan mockup statis. 6. Tambahkan validasi server-side, audit
trail, dan pengujian akses negatif. 7. Jangan menampilkan data contoh
sebagai data produksi; seed data harus diberi label demo dan dapat
dihapus. 8. Jangan menaruh secret di client bundle atau repository. 9.
Jalankan lint, typecheck, automated tests, dan build; perbaiki error
yang ditemukan. 10. Buat README berisi setup lokal, environment
variables, migration, test, deployment, backup/restore, dan
troubleshooting. 11. Laporkan fitur yang selesai, yang belum selesai,
keputusan yang diasumsikan, hasil pengujian, serta risiko tersisa. 12.
Jangan mengklaim deployment atau pengujian berhasil jika belum
benar-benar dijalankan.

### Definition of Done

MVP siap dipakai hanya setelah acceptance criteria lulus, UAT disetujui
Product Owner, hak akses diverifikasi, backup/restore diuji, dan
dokumentasi diserahkan.

------------------------------------------------------------------------

## Lampiran A --- Contoh Kategori Domain KINRA

Kategori berikut adalah tag awal untuk membantu analisis, bukan batasan
struktur organisasi: - Corporate governance, finance, and reporting -
Procurement and vendor management - Asset and facility management -
Industrial estate operations and maintenance - Investor relations and
investment pipeline - Tenant services and complaints - Utility services
and meter-to-cash - Environment, health, safety, and compliance - Human
resources and administration - IT operations, cyber security, and data -
Risk management and internal control - Executive reporting and decision
support - Other / cross-functional

## Lampiran B --- Contoh Output Akhir Assessment

Satu kebutuhan yang telah divalidasi sekurang-kurangnya menghasilkan: -
Need ID dan judul. - Bagian serta pemilik proses. - Masalah dan
baseline. - Dampak dan urgensi. - Hasil yang diharapkan. - Kategori
solusi awal. - Ketergantungan dan kesiapan. - Bukti dan catatan
wawancara. - Skor beserta rincian dan alasan. - Rekomendasi tindak
lanjut. - Status dan penanggung jawab berikutnya.

**Akhir dokumen --- PRD KINRA Digitalization Needs Assessment v1.0**
