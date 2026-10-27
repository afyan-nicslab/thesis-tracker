# PRD — Thesis Tracker v2

**Pemilik:** Afyan Cholil Asy'ari · **Status:** v1.1, 27 Oktober 2026
**v1 (lama):** https://afyancho.github.io/thesis-tracker/ · **v2:** dibangun dari nol di repo GitHub baru (alamat menyusul)

---

## 1. Latar belakang

Tracker v1 dibuat Juni 2026 untuk tujuan "10 minggu menuju email proposal ke calon pembimbing". Per Oktober 2026 kondisinya sudah berbeda: Afyan berada di semester 3 dengan jalur concept note, pengajuan dan penetapan pembimbing oleh KPS, Seminar Proposal (Sempro), bimbingan, Seminar Hasil, lalu Sidang.

Masalah v1:

- Isi (task, bacaan, jadwal, prompt) kedaluwarsa dan tertanam di `index.html`, sehingga setiap revisi isi berarti mengedit kode.
- Belum ada pencatatan untuk syarat administrasi kampus: kartu bimbingan, kehadiran Sempro/Sidang, dan dokumen AI disclosure.
- Bug (dikonfirmasi dari kode v1, 26 Okt 2026):
  - Label "Tersimpan" pada catatan muncul dari timer 600 ms di `attachTL()`, terlepas dari balasan server; `simpanKeSheets()` juga mengubah label yang sama, jadi ada dua jalur yang bertabrakan.
  - Catatan diubah di memori halaman sebelum server membalas; bila gagal, layar menampilkan catatan yang sebenarnya tidak tersimpan.
  - Centang task yang gagal terkirim (jaringan putus) tidak dibatalkan dan tidak ada pesan apa pun.
  - Catatan disisipkan mentah ke tampilan dan ke `<textarea>`, sehingga tag HTML ikut dijalankan dan teks `</textarea>` merusak form.
  - PIN diminta lewat jendela `prompt()` bawaan browser; gagal muat data ditampilkan lewat `alert()`; bilah progres memuat bergerak dari timer, bukan dari proses nyata.
- Pembacaan data (GET) terbuka bagi siapa pun yang membuka source halaman, karena satu-satunya pengaman adalah PIN untuk penulisan.

## 2. Tujuan

v2 adalah satu tempat untuk memantau seluruh perjalanan tesis dari Oktober 2026 sampai Sidang (target pertengahan 2027): persiapan (task, bacaan), penulisan (bab, subbab, masukan pembimbing), dan bukti untuk syarat administrasi.

**Ukuran keberhasilan**

1. Afyan dapat mengubah isi task, bacaan, linimasa, dan prompt **tanpa mengedit kode** (lihat Keputusan K1).
2. Setiap syarat administrasi Sempro dan Seminar Hasil terlihat statusnya dalam satu layar.
3. Log Bimbingan dan Log AI Disclosure dapat diekspor menjadi bahan pengisian kartu bimbingan dan formulir AI disclosure.
4. Tidak ada label "Tersimpan" sebelum server benar-benar membalas sukses.
5. Tidak ada data tracker yang bisa dibaca tanpa sign-in, termasuk oleh orang yang membuka source halaman.
6. Progres setiap bab terhitung otomatis dari tahap subbabnya, tanpa diisi manual.
7. Setiap masukan pembimbing tercatat sampai selesai ditindaklanjuti, dan yang masih terbuka terlihat dalam satu tampilan.

## 3. Pengguna

Setiap pengguna masuk lewat halaman sign-in. Akun tidak bisa didaftarkan sendiri; hanya pemilik yang menambahkan alamat email ke daftar izin (allowlist).

| Peran | Siapa | Kebutuhan | Hak |
| --- | --- | --- | --- |
| Pemilik | Afyan | Mencatat progres dari HP dan laptop | Baca dan tulis semua bagian; kelola daftar izin |
| Pembimbing | Pembimbing 1 dan 2 (panduan mewajibkan dua pembimbing), ditambahkan setelah resmi ditetapkan KPS | Melihat progres dan riwayat bimbingan tanpa harus dikirimi laporan | Baca bagian yang ditentukan K6; menulis hanya Masukan (F16) |

Pembimbing ditambahkan ke daftar izin hanya setelah Afyan memberi tahu dan beliau bersedia memakai tracker.

## 4. Fitur

Prioritas: **W** = wajib di rilis pertama, **S** = sebaiknya ada, **O** = opsional.

| Kode | Fitur | Isi utama | Prioritas |
| --- | --- | --- | --- |
| F0 | Halaman Sign-in | Halaman pertama sebelum isi apa pun dimuat; masuk dengan email + PIN pribadi (K5); opsi "ingat perangkat ini"; tombol keluar | W |
| F1 | Dashboard | Jalur milestone: concept note → persetujuan pembimbing → Sempro → bimbingan → Seminar Hasil → Sidang; progres per fase; ringkasan syarat yang belum terpenuhi | W |
| F2 | To-Do List | Task baru sesuai semester 3; filter Semua / Belum / Selesai; catatan per task | W |
| F3 | Bacaan Wajib | 20 referensi (id 1–20, versi 17 Okt 2026); status baca dan status verifikasi referensi | W |
| F4 | Linimasa | Menggantikan "Jadwal 10 Minggu"; per bulan, Okt 2026 sampai pertengahan 2027 | W |
| F5 | Checklist Syarat Administrasi | Syarat Sempro dan Seminar Hasil dari Panduan Tesis 2025 Bab V (lihat Lampiran A), termasuk penghitung kehadiran Sempro/Sidang (5 dan 10 kali) | W |
| F6 | Log Bimbingan | Tanggal, pembimbing, topik, masukan, tindak lanjut; penghitung x/10 | W |
| F7 | Log AI Disclosure | Tanggal, alat AI, tujuan, bagian tesis, jenis bantuan (tutor/kritik/cek logika/lainnya); ekspor ringkasan | W |
| F8 | Prompt Library | Prompt mode kritik dan tutor (bukan menulis teks jadi), sesuai batas AI 15% | S |
| F9 | Tema terang/gelap | Mengikuti pengaturan perangkat | O |
| F10 | Kelola Akses | Pemilik menambah, menonaktifkan, mereset PIN, dan melihat waktu masuk terakhir setiap akun di daftar izin | W |
| F11 | Tampilan per peran | Menu dan tombol menyesuaikan peran; pembimbing tidak melihat tombol ubah di bagian yang hanya bisa dibaca | W |
| F12 | (digabung ke F16) | Catatan pembimbing kini dicatat sebagai Masukan | – |
| F18 | Ganti PIN | Setiap pengguna dapat mengganti PIN-nya sendiri, sehingga PIN awal yang dibuatkan pemilik untuk pembimbing tidak perlu dipakai seterusnya | S |

### Modul Penulisan

Struktur modul ini terinspirasi templat Notion "Dissertation & Thesis Tracker" (tiga basis data: Chapters, Sections, Feedback), disesuaikan dengan struktur bab Panduan Tesis Tazkia 2025 (Lampiran C). Yang diambil adalah struktur dan cara kerjanya; cover, ikon, dan teks templat tidak disalin.

| Kode | Fitur | Isi utama | Prioritas |
| --- | --- | --- | --- |
| F13 | Bab | Dikelompokkan per dokumen: Concept Note, Proposal (Bab I–III), Tesis (Bab IV–V). Per bab: tanggal target, bilah progres, jumlah subbab final, jumlah masukan terbuka, hitung mundur hari | W |
| F14 | Subbab | Terisi awal sesuai Panduan (1.1 Latar Belakang sampai 5.4 Saran). Per subbab: tahap, tenggat, jumlah kata (opsional), tanda terlambat | W |
| F15 | Papan Penulisan | Subbab dikelompokkan per tahap dalam kolom. Laptop dan tablet: kartu diseret antar-kolom (sentuh: tahan sebentar, lalu seret); pilihan tahap di tiap kartu tetap ada sebagai cara cadangan dan untuk keyboard. HP: satu tahap per layar, pindah tahap lewat pilihan, bukan seret | W |
| F16 | Masukan | Judul masukan, dari siapa (Pembimbing 1, Pembimbing 2, Penguji Sempro), bab terkait, tanggal diterima, status (Terbuka, Dikerjakan, Selesai), "langkahku" (tindakan yang akan dilakukan), lama menunggu dalam hari, tautan opsional ke entri Log Bimbingan | W |
| F17 | Tampilan tersaring | Terlambat (subbab lewat tenggat dan belum final), Masukan Terbuka (terlama di atas), Log Masukan (terbaru di atas) | W |

**Aturan hitung**

- Tahap subbab bernilai 0–4: Belum mulai (0), Draf (1), Revisi (2), Di pembimbing (3), Final (4).
- Progres bab = rata-rata nilai tahap subbabnya ÷ 4, dalam persen.
- Masukan berstatus Terbuka atau Dikerjakan dihitung sebagai "terbuka" pada babnya; status Selesai tidak dihitung.
- Subbab dianggap terlambat bila tenggatnya sudah lewat dan tahapnya belum Final.

### Perilaku yang wajib benar

- Status "Tersimpan" hanya muncul setelah server membalas sukses; bila gagal, tampil pesan gagal dan isi catatan tidak hilang.
- Centang yang gagal tersimpan dikembalikan ke posisi semula disertai pesan.
- Pesan error tampil di halaman, bukan `alert()`.
- Tanpa sesi yang sah, server menolak **baca maupun tulis**; halaman hanya menampilkan form sign-in.
- Hak akses diperiksa di server (Apps Script) pada setiap permintaan, bukan hanya disembunyikan di tampilan.
- Token sesi dikirim di body permintaan, tidak pernah di URL.
- Sesi kedaluwarsa otomatis; tombol keluar menghapus sesi di perangkat dan di server.
- Percobaan sign-in yang gagal dibatasi: 5 kali salah membuat akun terkunci 15 menit, dan ada batas total percobaan gagal per jam untuk semua akun.
- PIN minimal 6 digit; tidak boleh berupa urutan atau angka berulang (123456, 111111).
- PIN tidak pernah disimpan apa adanya. Yang disimpan di Sheet hanya hasil hash (HMAC-SHA256) dari salt acak per pengguna + PIN, dengan kunci `PIN_PEPPER` yang hanya ada di Script Properties.
- Semua teks dari pengguna (catatan, log) ditampilkan sebagai teks biasa, bukan HTML.
- Status task, bacaan, bab, subbab, dan masukan terikat ke `id`, bukan ke judul.
- Progres bab, hitungan masukan terbuka, dan tanda terlambat dihitung otomatis, tidak bisa diisi manual.
- Tampilan nyaman di HP (navigasi bawah tetap dipertahankan) dan di laptop.

## 5. Di luar cakupan

- Mengganti arsitektur (tetap GitHub Pages + Apps Script + Google Sheet).
- Framework atau proses build (tetap HTML/CSS/JS biasa).
- Pendaftaran akun mandiri (sign-up terbuka); semua akun dibuat pemilik lewat daftar izin.
- Sinkronisasi otomatis dengan SMILE Tazkia.
- Fitur yang menulis naskah tesis.

## 6. Kebutuhan non-fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Keamanan | Rahasia (kunci, salt, atau PIN lama) hanya di Script Properties; tidak pernah ditulis di repo, chat, atau dokumen. Google Sheet tetap Restricted karena berisi email pembimbing. Ini pengamanan untuk tracker pribadi, bukan standar perbankan: tetap jangan menyimpan data sensitif di catatan |
| Repo publik | GitHub Pages gratis mensyaratkan repo publik, sehingga kode dan dokumen di repo tidak boleh berisi rahasia maupun data pribadi (nama pembimbing, catatan, isi log). Semua itu hanya ada di Sheet |
| Kemudahan edit | Isi diubah lewat Sheet (bila K1 disetujui) |
| Kinerja | Halaman tampil di HP dalam waktu wajar walau data dari Apps Script lambat; tampilkan status memuat |
| Ketahanan | Bila Apps Script gagal dihubungi, halaman tetap tampil dengan pesan yang jelas |

## 7. Migrasi data

v2 dibangun dari nol (K8), jadi tidak ada pemindahan struktur atau kode dari v1. Yang dibawa hanya isi:

- 20 bacaan versi 17 Okt 2026 (id 1–20) beserta status bacanya.
- Status task v1 (id 1–3 selesai) ditandai manual pada task baru yang setara, karena daftar task ikut direvisi.
- Linimasa, prompt, dan task disusun ulang sesuai temuan validasi 17 Okt 2026, bukan disalin apa adanya.

Setelah v2 dipakai, deployment Apps Script v1 dimatikan dan `PIN_RAHASIA` dihapus. Langkah ini penting karena alamat API v1 tetap tercantum di repo lama dan masih bisa dipakai membaca data v1.

## 8. Keputusan terbuka

| Kode | Pertanyaan | Rekomendasi | Status |
| --- | --- | --- | --- |
| K1 | Pindahkan isi (task, bacaan, linimasa, prompt) dari `index.html` ke Sheet? | Ya. Arsitektur tetap sama, tetapi revisi isi cukup lewat Sheet | **Disetujui 26 Okt 2026** |
| K2 | Pembacaan data dilindungi? | Diselesaikan oleh sign-in: semua baca dan tulis memerlukan sesi | **Diputuskan 26 Okt 2026** |
| K3 | Apakah tracker dibagikan ke pembimbing? | Ya, lewat akun berperan Pembimbing, setelah pembimbing resmi ditetapkan | **Diputuskan 26 Okt 2026** |
| K4 | Cara menampilkan pembimbing | "Calon pembimbing" + nama dan gelar, tanpa jabatan. Nama diisi di Sheet, tidak ditulis di kode atau dokumen repo | **Disetujui 26 Okt 2026** |
| K5 | Metode sign-in | Email + PIN pribadi per pengguna; hash dengan salt per pengguna dan `PIN_PEPPER` di Script Properties (lihat Lampiran B) | **Diputuskan 26 Okt 2026** |
| K6 | Bagian yang dilihat pembimbing | Lihat: Dashboard, Bab, Subbab, Papan Penulisan, Masukan, Linimasa, Checklist Syarat, Log Bimbingan, Bacaan Wajib, Log AI Disclosure. Tidak lihat: catatan pribadi task, Prompt Library, Kelola Akses | **Disetujui 26 Okt 2026** |
| K8 | Cara membangun | Dari nol: repo GitHub baru, Google Sheet baru, proyek Apps Script baru. v1 tidak diubah dan dimatikan setelah v2 dipakai | **Diputuskan 26 Okt 2026** |
| K7 | Arah tampilan | Struktur informasi mengikuti templat Notion (bab, subbab, masukan, tampilan tersaring); bahasa visual mengikuti gaya Apple (lihat DESIGN-SYSTEM.md) | **Diputuskan 26 Okt 2026** |

## 9. Kriteria penerimaan rilis pertama

- [ ] F1–F7 tampil dan berfungsi di HP dan laptop
- [ ] Simpan catatan: label "Tersimpan" hanya setelah balasan sukses (diuji dengan koneksi dimatikan)
- [ ] Catatan berisi `<b>tes</b>` dan `</textarea>` tampil sebagai teks apa adanya dan bisa diedit ulang
- [ ] Centang saat koneksi mati kembali ke posisi semula dan muncul pesan gagal
- [ ] Catatan tetap ada setelah refresh
- [ ] Permintaan baca dan tulis tanpa sesi ditolak server (diuji langsung ke URL Apps Script, bukan lewat tampilan)
- [ ] Akun pembimbing tidak bisa mengubah data selain catatan pembimbing, termasuk bila permintaan dikirim manual
- [ ] Email yang tidak ada di daftar izin tidak bisa masuk
- [ ] Keluar di satu perangkat membuat token lama ditolak
- [ ] Progres bab berubah otomatis saat tahap subbab diubah (contoh uji: dua subbab di tahap Final dan Draf menghasilkan 63%)
- [ ] Masukan yang diubah ke Selesai langsung hilang dari Masukan Terbuka dan mengurangi hitungan di babnya
- [ ] Akun pembimbing dapat membuat Masukan, tetapi tidak dapat mengubah tahap subbab
- [ ] Kartu yang diseret ke kolom lain tersimpan setelah server membalas; bila gagal, kartu kembali ke kolom asal disertai pesan
- [ ] Penghitung bimbingan dan kehadiran Sempro sesuai jumlah baris log

---

## Lampiran A — Syarat administrasi (Panduan Tesis 2025, Bab V; Memo FEBS No. 007-A/2026)

**Seminar Proposal**

1. Lulus mata kuliah Metode Riset minimal C
2. Menghadiri Sempro sebelumnya minimal 5 kali (kartu kehadiran)
3. Persetujuan dosen pembimbing yang disetujui KPS (form persetujuan)
4. Draft proposal disubmit lewat SMILE, maksimal 5 hari kerja sebelum Sempro
5. Concept note (soft file) dikirim lewat SMILE
6. Tidak ada tunggakan SPP
7. Dokumen AI: hasil cek AI detector maksimal 15% dan dokumen AI disclosure, diunggah di SMILE (fitur Laporan Uji Plagiarisme)

**Seminar Hasil**

1. Menghadiri sidang/Sempro sebelumnya minimal 10 kali
2. Bimbingan minimal 10 kali (kartu bimbingan)
3. Persetujuan kedua dosen pembimbing
4. Draft tesis lima bab lewat SMILE, maksimal 5 hari kerja sebelumnya
5. CV terbaru lewat SMILE
6. Tidak ada tunggakan SPP

**Sidang Tesis:** dokumen AI (cek detector maksimal 15% dan AI disclosure) wajib dilampirkan kembali saat pendaftaran.

## Lampiran B — Perbandingan metode sign-in (untuk K5)

Semua opsi berjalan di arsitektur yang sama (GitHub Pages + Apps Script + Sheet). **Dipilih: email + PIN pribadi** (varian kolom ketiga dengan PIN sebagai pengganti kata sandi), karena paling sederhana dibangun dan tidak bergantung pada pengiriman email. Konsekuensinya: pemilik membuatkan PIN awal untuk pembimbing (diserahkan lewat jalur pribadi, bukan grup), dan F18 Ganti PIN menjadi penting.

| Aspek | Kode sekali pakai lewat email | Google Sign-In | Email + kata sandi |
| --- | --- | --- | --- |
| Cara masuk | Ketik email, terima kode 6 digit, masukkan kode | Klik tombol "Masuk dengan Google" | Ketik email dan kata sandi |
| Yang perlu dimiliki pembimbing | Alamat email apa saja | Akun Google | Kata sandi yang dibuatkan Afyan |
| Penyimpanan rahasia | Tidak ada kata sandi tersimpan; kode kedaluwarsa dalam hitungan menit | Tidak ada kata sandi tersimpan | Hash kata sandi di Sheet; perlu alur lupa kata sandi |
| Pengaturan awal | Hanya Apps Script (MailApp) | Perlu membuat OAuth Client ID di Google Cloud Console | Hanya Apps Script |
| Tingkat kesulitan bagi pemula | Sedang | Sedang sampai tinggi | Tinggi (hash, reset, pembatasan percobaan) |
| Catatan | Kuota kirim email harian Apps Script terbatas (perlu verifikasi angka terbaru), tetapi jauh di atas kebutuhan 3 pengguna | Paling aman dan nyaman bila semua pengguna memakai Google | Paling banyak hal yang bisa salah |

## Lampiran C — Struktur bab (Panduan Tesis Tazkia 2025)

**Concept Note** (±10 halaman): Halaman Judul, Pendahuluan, Rumusan Masalah, Tujuan Penelitian, Tinjauan Pustaka, Metode Penelitian, Daftar Pustaka.

**Proposal (Bab I–III) dan Tesis (Bab I–V)**

| Bab | Subbab |
| --- | --- |
| I. Pendahuluan | 1.1 Latar Belakang · 1.2 Perumusan Masalah · 1.3 Tujuan Penelitian · 1.4 Batasan Penelitian · 1.5 Manfaat Penelitian |
| II. Tinjauan Pustaka | 2.1 Landasan Teori · 2.2 Landasan Syariah · 2.3 Penelitian Sebelumnya · 2.4 Kerangka Pemikiran · 2.5 Hipotesis Penelitian (jika ada) |
| III. Metode Penelitian | 3.1 Desain Penelitian · 3.2 Populasi dan Sampel · 3.3 Data dan Sumber Data · 3.4 Teknik Pengumpulan Data · 3.5 Definisi Operasional Variabel · 3.6 Teknik Analisis Data |
| IV. Hasil Penelitian dan Pembahasan | 4.1 Hasil Penelitian · 4.2 Pembahasan |
| V. Penutup | 5.1 Kesimpulan · 5.2 Implikasi · 5.3 Keterbatasan Penelitian · 5.4 Saran |

Catatan: untuk tesis, panduan menyebut Bab II sebagai "Kajian Teoritik", sedangkan untuk proposal "Tinjauan Pustaka". Judul yang dipakai perlu dikonfirmasi ke template terbaru.
